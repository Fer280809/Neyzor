process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { 
  makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import cfonts from 'cfonts'
import chalk from 'chalk'
import { handler } from './lib/handler.js'
import { loadPlugins } from './lib/loader.js'
import fs from 'fs'
import readline from 'readline'

console.clear()

cfonts.say('ASTA', {
  font: 'block',
  align: 'center',
  gradient: ['#00D9FF', '#FF006E'],
  space: false
})

cfonts.say('BOT', {
  font: 'tiny',
  align: 'center',
  colors: ['#00FF88']
})

console.log(chalk.cyan('\n' + '═'.repeat(50)))
console.log(chalk.white('  Versión:'), chalk.yellow('3.0.0'))
console.log(chalk.white('  Baileys:'), chalk.yellow('Latest (GitHub)'))
console.log(chalk.white('  Canvas:'), chalk.yellow('@napi-rs/canvas'))
console.log(chalk.white('  Node:'), chalk.yellow(process.version))
console.log(chalk.cyan('═'.repeat(50) + '\n'))

const dirs = ['sessions', 'tmp', 'commands', 'events', 'assets']
for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Leer argumentos
const methodCodeQR = process.argv.includes("qr")
const methodCode = process.argv.includes("code")

// 🔧 BAILEYS SETUP
const logger = pino({ level: 'silent' })
const { state, saveCreds } = await useMultiFileAuthState(global.config.sessionDir)
const { version } = await fetchLatestBaileysVersion()

console.log(chalk.blue(`📦 Baileys v${version.join('.')}`))

const sock = makeWASocket({
  version,
  logger,
  printQRInTerminal: false,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  },
  browser: ['Asta-bot', 'Chrome', '120.0.0'],
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  markOnlineOnConnect: true
})

// Variable para controlar si ya solicitamos el código
let codeRequested = false
let pairingCodePromise = null

// 📱 LÓGICA DE VINCULACIÓN (CÓDIGO O QR)
if (!fs.existsSync(`./${global.config.sessionDir}/creds.json`)) {
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))
  
  let opcion = null
  
  // Determinar modo
  if (methodCodeQR) {
    opcion = '1'
  } else if (methodCode) {
    opcion = '2'
  } else {
    // Preguntar modo
    do {
      opcion = await question(
        chalk.bold.white("Seleccione opción:\n") + 
        chalk.blueBright("1. QR\n") + 
        chalk.cyan("2. Código\n") + 
        chalk.bold.white("▶▶▶ ")
      )
      if (!/^[1-2]$/.test(opcion)) {
        console.log(chalk.bold.redBright(`✖ Solo 1 o 2`))
      }
    } while (!/^[1-2]$/.test(opcion))
  }
  
  // MODO CÓDIGO (2)
  if (opcion === '2') {
    console.log(chalk.yellow('[⚡] Modo código activado'))
    
    // Escuchar cuando el socket esté listo para solicitar código
    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update
      
      // Solo solicitar código si no está registrado y no lo hemos solicitado aún
      if (!sock.authState.creds.registered && !codeRequested && connection !== 'open') {
        codeRequested = true
        
        try {
          let phoneNumber = global.botNumber || global.config?.botNumber
          
          if (!phoneNumber) {
            phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`[📱] Número WhatsApp (con código de país, ej: 521234567890):\n▶▶▶ `)))
            phoneNumber = phoneNumber.replace(/\D/g, '')
          } else {
            rl.close()
          }
          
          if (phoneNumber.length < 10) {
            console.log(chalk.red('✖ Número inválido. Debe incluir código de país.'))
            process.exit(1)
          }
          
          console.log(chalk.cyan(`[⏳] Solicitando código para: ${phoneNumber}...`))
          
          // Esperar un momento para que la conexión se establezca
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Solicitar código de emparejamiento
          const pairingCode = await sock.requestPairingCode(phoneNumber)
          const formattedCode = pairingCode.match(/.{1,4}/g)?.join("-") || pairingCode
          
          console.log(chalk.bold.white(chalk.bgMagenta(`\n═══════════════════════`)))
          console.log(chalk.bold.white(chalk.bgMagenta(`   📲 CÓDIGO DE VINCULACIÓN  `)))
          console.log(chalk.bold.white(chalk.bgMagenta(`═══════════════════════`)))
          console.log(chalk.bold.white(chalk.bgGreen(`       ${formattedCode}       `)))
          console.log(chalk.bold.white(chalk.bgMagenta(`═══════════════════════`)))
          console.log(chalk.yellow('\n[📱] Abre WhatsApp > Menú > Dispositivos vinculados'))
          console.log(chalk.yellow('[📱] Toca "Vincular con número de teléfono"'))
          console.log(chalk.yellow('[⏳] Ingresa el código mostrado arriba...\n'))
          
          if (!global.botNumber && !global.config?.botNumber) {
            rl.close()
          }
          
        } catch (error) {
          console.error(chalk.red(`\n✖ Error: ${error.message}`))
          console.log(chalk.yellow('[💡] Intenta con modo QR: node index.js --qr'))
          process.exit(1)
        }
      }
      
      // Si aparece QR en modo código, ignorarlo
      if (qr && opcion === '2') {
        console.log(chalk.gray('[ℹ️] Ignorando QR (modo código activado)'))
      }
    })
    
  } 
  // MODO QR (1)
  else {
    console.log(chalk.yellow('[📱] Modo QR activado'))
    console.log(chalk.yellow('[⏳] Esperando QR...'))
    
    sock.ev.on('connection.update', (update) => {
      if (update.qr) {
        console.log(chalk.green('\n[✓] QR generado! Escanea con WhatsApp:\n'))
      }
    })
    
    rl.close()
  }
  
} else {
  console.log(chalk.green('[✓] Sesión existente encontrada, conectando...'))
}

// 📡 MANEJO DE CONEXIÓN PRINCIPAL

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update

  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
      ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
      : true

    console.log(chalk.red('\n❌ Desconectado'))

    if (shouldReconnect) {
      console.log(chalk.yellow('🔄 Reconectando en 3 segundos...'))
      setTimeout(() => process.exit(1), 3000)
    } else {
      console.log(chalk.red('⚠️ Sesión cerrada manualmente.'))
      process.exit(0)
    }
  }

  if (connection === 'open') {
    console.log(chalk.greenBright('\n' + '═'.repeat(50)))
    console.log(chalk.greenBright('  ✅ BOT CONECTADO EXITOSAMENTE'))
    console.log(chalk.greenBright('═'.repeat(50) + '\n'))

    const user = sock.user
    console.log(chalk.cyan(`👤 Nombre: ${user?.name || 'Unknown'}`))
    console.log(chalk.cyan(`📱 Número: ${user?.id?.split(':')[0] || 'Unknown'}\n`))

    await loadPlugins(sock)

    // Notificar owners
    for (const owner of global.config.owners) {
      try {
        await sock.sendMessage(owner + '@s.whatsapp.net', {
          text: `✅ *${global.config.botName}* está en línea!\n\n📅 ${new Date().toLocaleString()}\n📱 ${user?.id?.split(':')[0]}`
        })
      } catch (e) {
        console.log(chalk.gray(`[ℹ️] No se pudo notificar a owner: ${owner}`))
      }
    }
  }
})

// 💬 MENSAJES
sock.ev.on('messages.upsert', async (m) => {
  const msg = m.messages[0]
  if (!msg.message || msg.key.remoteJid === 'status@broadcast') return
  if (msg.key.fromMe) return

  await handler(sock, msg, sock, false, null)
})

// 👥 EVENTOS DE GRUPO
sock.ev.on('group-participants.update', async (update) => {
  if (global.events) {
    const welcomeEvent = global.events.get('welcome')
    const promoteEvent = global.events.get('admin-notify')
    
    if (welcomeEvent && (update.action === 'add' || update.action === 'remove')) {
      await welcomeEvent.run({ sock, update })
    }
    
    if (promoteEvent && (update.action === 'promote' || update.action === 'demote')) {
      await promoteEvent.run({ sock, update })
    }
  }
})

sock.ev.on('groups.update', async (updates) => {
  if (global.events) {
    const groupEvent = global.events.get('group-events')
    if (groupEvent) await groupEvent.run({ sock, update: updates })
  }
})

// 🛑 ERRORES
process.on('uncaughtException', (err) => {
  console.error(chalk.red('[ERROR]'), err)
})

process.on('unhandledRejection', (err) => {
  console.error(chalk.red('[REJECTION]'), err)
})

global.sock = sock
console.log(chalk.cyan('\n⏳ Iniciando conexión...\n'))
