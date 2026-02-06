process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

// ═══════════════════════════════════════════════════════════════
// 🤖 NEYROX BOT MAX - SISTEMA PRINCIPAL v3.0 (FIXED)
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// 🎨 BANNER
// ═══════════════════════════════════════════════════════════════

console.clear()

cfonts.say('NEYROX', {
  font: 'block',
  align: 'center',
  gradient: ['#00D9FF', '#FF006E'],
  space: false
})

cfonts.say('BOT MAX', {
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

// ═══════════════════════════════════════════════════════════════
// 📁 DIRECTORIOS
// ═══════════════════════════════════════════════════════════════

const dirs = ['sessions', 'tmp', 'commands', 'events', 'assets']
for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔧 SELECCIÓN QR / CÓDIGO (CORREGIDO)
// ═══════════════════════════════════════════════════════════════

const rl = readline.createInterface({ 
  input: process.stdin, 
  output: process.stdout,
  terminal: true
})

const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

const methodCodeQR = process.argv.includes("--qr") || process.argv.includes("qr")
const methodCode = process.argv.includes("--code") || process.argv.includes("code")
const sessionExists = fs.existsSync(`./${global.config.sessionDir}/creds.json`)

let opcion = null

// Si ya existe sesión, no preguntar
if (sessionExists) {
  console.log(chalk.green('✅ Sesión existente encontrada, conectando...'))
  opcion = '1' // No importa, usará creds existentes
} 
// Si se pasó argumento --qr
else if (methodCodeQR) {
  opcion = '1'
  console.log(chalk.yellow('[📱] Modo QR forzado por argumento'))
}
// Si se pasó argumento --code
else if (methodCode) {
  opcion = '2'
  console.log(chalk.yellow('[📱] Modo CÓDIGO forzado por argumento'))
}
// Si no hay argumentos ni sesión, preguntar al usuario
else {
  do {
    opcion = await question(
      chalk.bold.white("Seleccione método de conexión:\n") + 
      chalk.blueBright("1. Escanear QR\n") + 
      chalk.cyan("2. Código de emparejamiento (8 dígitos)\n") + 
      chalk.bold.white("▶▶▶ ")
    )
    
    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.bold.redBright(`❌ Opción inválida. Escribe 1 o 2.`))
    }
  } while (!/^[1-2]$/.test(opcion))
}

// ═══════════════════════════════════════════════════════════════
// 🔧 BAILEYS
// ═══════════════════════════════════════════════════════════════

const logger = pino({ level: 'silent' })
const { state, saveCreds } = await useMultiFileAuthState(global.config.sessionDir)
const { version } = await fetchLatestBaileysVersion()

console.log(chalk.blue(`📦 Baileys v${version.join('.')}`))

const sock = makeWASocket({
  version,
  logger,
  printQRInTerminal: opcion === '1',
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  },
  browser: ['Neyrox-Bot-Max', 'Chrome', '120.0.0'],
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  markOnlineOnConnect: true
})

sock.ev.on('creds.update', saveCreds)

// ═══════════════════════════════════════════════════════════════
// 📱 MODO CÓDIGO (CORREGIDO)
// ═══════════════════════════════════════════════════════════════

if (!sessionExists && opcion === '2') {
  console.log(chalk.yellow('\n[⚡] Modo código activado'))
  
  if (!sock.authState.creds.registered) {
    let phoneNumber = ''
    
    // Pedir número hasta que sea válido
    do {
      phoneNumber = await question(
        chalk.bgBlack(chalk.bold.greenBright(`[📱] Ingresa tu número de WhatsApp:\n`)) +
        chalk.gray('Formato: 5214183357841 (código país + número)\n▶▶▶ ')
      )
      phoneNumber = phoneNumber.replace(/\D/g, '')
      
      // Validación básica: debe tener al menos 10 dígitos
      if (phoneNumber.length < 10) {
        console.log(chalk.red('❌ Número inválido. Debe incluir código de país.'))
      }
    } while (phoneNumber.length < 10)

    console.log(chalk.cyan('\n[⏳] Solicitando código de emparejamiento...'))
    
    try {
      // Asegurar que no tenga +
      const cleanNumber = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber
      
      let codeBot = await sock.requestPairingCode(cleanNumber)
      
      if (codeBot) {
        // Formatear código: XXXX-XXXX
        const formattedCode = codeBot.match(/.{1,4}/g)?.join("-") || codeBot
        
        console.log(chalk.bold.white(chalk.bgMagenta(`\n═══════════════════════`)))
        console.log(chalk.bold.white(chalk.bgMagenta(`   📲 CÓDIGO WHATSAPP   `)))
        console.log(chalk.bold.white(chalk.bgMagenta(`═══════════════════════`)))
        console.log(chalk.bold.white(chalk.bgGreen(`     ${formattedCode}     `)))
        console.log(chalk.bold.white(chalk.bgMagenta(`═══════════════════════`)))
        console.log(chalk.yellow('\n📱 Abre WhatsApp > Dispositivos vinculados > Vincular'))
        console.log(chalk.yellow('⏳ El código expira en 2 minutos\n'))
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error al generar código: ${error.message}`))
      console.log(chalk.yellow('💡 Intenta con el modo QR: node index.js --qr'))
      process.exit(1)
    }
  }
}

// Cerrar readline solo después de usarlo
if (rl && !rl.closed) {
  rl.close()
}

// ═══════════════════════════════════════════════════════════════
// 📡 CONEXIÓN
// ═══════════════════════════════════════════════════════════════

sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update

  if (qr && opcion === '1') {
    console.log(chalk.yellow('\n📱 Escanea el QR code que aparece arriba ↑\n'))
  }

  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
      ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
      : true

    console.log(chalk.red('\n❌ Desconectado'))

    if (shouldReconnect) {
      console.log(chalk.yellow('🔄 Reconectando en 3 segundos...'))
      setTimeout(() => process.exit(1), 3000)
    } else {
      console.log(chalk.red('🚫 Sesión cerrada. Borra la carpeta sessions y reinicia.'))
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

    // Notificar a owners
    for (const owner of global.config.owners) {
      try {
        await sock.sendMessage(owner + '@s.whatsapp.net', {
          text: `✅ *${global.config.botName}* Max conectado!\n\n👤 Usuario: ${user?.name || 'Unknown'}\n📱 Número: ${user?.id?.split(':')[0]}\n📅 ${new Date().toLocaleString()}`
        })
      } catch (e) {
        console.log(chalk.yellow(`⚠️ No se pudo notificar al owner ${owner}`))
      }
    }
  }
})

// ═══════════════════════════════════════════════════════════════
// 💬 MENSAJES
// ═══════════════════════════════════════════════════════════════

sock.ev.on('messages.upsert', async (m) => {
  const msg = m.messages[0]
  if (!msg.message || msg.key.remoteJid === 'status@broadcast') return

  await handler(sock, msg, sock, false, null)
})

// ═══════════════════════════════════════════════════════════════
// 👥 EVENTOS DE GRUPO
// ═══════════════════════════════════════════════════════════════

sock.ev.on('group-participants.update', async (update) => {
  if (global.events) {
    const welcomeEvent = global.events.get('welcome')
    const promoteEvent = global.events.get('admin-notify')
    
    if (welcomeEvent) await welcomeEvent.run({ sock, update })
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

// ═══════════════════════════════════════════════════════════════
// 🛑 ERRORES
// ═══════════════════════════════════════════════════════════════

process.on('uncaughtException', (err) => {
  console.error(chalk.red('❌ Uncaught Exception:'), err)
})

process.on('unhandledRejection', (err) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), err)
})

global.sock = sock

console.log(chalk.cyan('\n⏳ Iniciando conexión...\n'))
