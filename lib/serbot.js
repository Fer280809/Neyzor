import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode'
import { handler } from './handler.js'
import { getSubBotConfig, save } from './database.js'

const sessionsDir = './sessions/subbots'

if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true })
}

if (!global.subBots) global.subBots = new Map()

/**
 * Crea un sub-bot
 */
export async function createSubBot(mode = 'qr', phoneNumber = null) {
  const sessionId = `subbot_${Date.now()}`
  const sessionPath = path.join(sessionsDir, sessionId)

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const { version } = await fetchLatestBaileysVersion()

  const logger = pino({ level: 'silent' })

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: mode === 'qr',
    auth: state,
    browser: ['Neyrox-SubBot', 'Chrome', '120.0.0'],
    generateHighQualityLinkPreview: true
  })

  return new Promise((resolve, reject) => {
    let resolved = false

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (mode === 'qr' && qr && !resolved) {
        resolved = true
        try {
          const qrDataUrl = await qrcode.toDataURL(qr)
          resolve({
            mode: 'qr',
            qr: qrDataUrl,
            sessionId,
            sock,
            status: 'pending'
          })
        } catch (err) {
          reject(err)
        }
      }

      if (mode === 'code' && phoneNumber && !resolved) {
        try {
          const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
          const code = await sock.requestPairingCode(cleanNumber)
          const formattedCode = code.match(/.{1,4}/g)?.join('-') || code

          resolved = true
          resolve({
            mode: 'code',
            code: formattedCode,
            rawCode: code,
            sessionId,
            sock,
            status: 'pending'
          })
        } catch (err) {
          if (!resolved) {
            resolved = true
            reject(err)
          }
        }
      }

      if (connection === 'open') {
        console.log(`✅ Sub-bot conectado: ${sessionId}`)

        // Inicializar config
        getSubBotConfig(sessionId)

        global.subBots.set(sessionId, {
          sock,
          sessionId,
          user: sock.user,
          phoneNumber,
          mode,
          connectedAt: new Date(),
          status: 'connected'
        })

        // Notificar owner
        for (const owner of global.config.owners) {
          try {
            const mainSock = global.sock
            if (mainSock) {
              await mainSock.sendMessage(owner + '@s.whatsapp.net', {
                text: `🤖 *Nuevo Sub-Bot*\n\n📱 ${sock.user.id.split(':')[0]}\n👤 ${sock.user.name || 'Unknown'}\n🆔 ${sessionId}`
              })
            }
          } catch {}
        }

        // Iniciar handler para este sub-bot
        startSubBotHandler(sock, sessionId)
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true

        if (!shouldReconnect) {
          fs.rmSync(sessionPath, { recursive: true, force: true })
          global.subBots.delete(sessionId)
        }
      }
    })

    sock.ev.on('creds.update', saveCreds)
  })
}

/**
 * Inicia el handler para un sub-bot
 */
function startSubBotHandler(sock, sessionId) {
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return

    // Pasar true para isSubBot y el sessionId
    await handler(sock, msg, sock, true, sessionId)
  })

  // Eventos de grupo para sub-bot
  sock.ev.on('group-participants.update', async (update) => {
    if (global.events) {
      const welcomeEvent = global.events.get('welcome')
      if (welcomeEvent) {
        await welcomeEvent.run({ sock, update })
      }
    }
  })
}

export function getSubBots() {
  return global.subBots || new Map()
}

export function getSubBot(sessionId) {
  return global.subBots?.get(sessionId)
}

export async function removeSubBot(sessionId) {
  const subBot = global.subBots?.get(sessionId)
  if (subBot) {
    try {
      await subBot.sock.logout()
    } catch {}

    const sessionPath = path.join(sessionsDir, sessionId)
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
    }

    global.subBots.delete(sessionId)
    return true
  }
  return false
}

export async function restartSubBot(sessionId) {
  const subBot = global.subBots?.get(sessionId)
  if (!subBot) return false

  try {
    await subBot.sock.ws.close()

    setTimeout(async () => {
      const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionsDir, sessionId))
      const { version } = await fetchLatestBaileysVersion()

      const newSock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['Neyrox-SubBot', 'Chrome', '120.0.0']
      })

      newSock.ev.on('creds.update', saveCreds)
      startSubBotHandler(newSock, sessionId)

      global.subBots.set(sessionId, {
        ...subBot,
        sock: newSock,
        status: 'connected'
      })
    }, 3000)

    return true
  } catch (error) {
    console.error('Error reiniciando:', error)
    return false
  }
}

export async function restartAllSubBots() {
  const results = []
  for (const [id] of global.subBots) {
    const success = await restartSubBot(id)
    results.push({ id, success })
  }
  return results
}

export async function removeAllSubBots() {
  const promises = []
  for (const [id] of global.subBots) {
    promises.push(removeSubBot(id))
  }
  await Promise.all(promises)
  return true
}

export function getSubBotStats() {
  const bots = Array.from(global.subBots.values())
  return {
    total: bots.length,
    connected: bots.filter(b => b.status === 'connected').length,
    list: bots.map(b => ({
      sessionId: b.sessionId,
      number: b.user?.id?.split(':')[0],
      name: b.user?.name,
      mode: b.mode,
      status: b.status,
      connectedAt: b.connectedAt
    }))
  }
}

export default { 
  createSubBot, getSubBots, getSubBot, removeSubBot, 
  restartSubBot, restartAllSubBots, removeAllSubBots, getSubBotStats 
}
