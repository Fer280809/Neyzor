import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"

// ═══════════════════════════════════════════════════════════════
// ⚡ NEYROX BOT MAX - CONFIGURACIÓN DINÁMICA
// ═══════════════════════════════════════════════════════════════

// Config base 
const defaultConfig = {
  // 👑 Propietarios (fijos, no editables)
  owners: ['5214183357841'],

  // 🤖 Configuración del bot 
  botName: '『𝕬𝖘𝖙𝖆-𝕭𝖔𝖙』',
  botVersion: '2.0',
  botDesc: 'Asta-bot mejora tu experiencia en WhatsApp',
  botLogo: './assets/logo.jpg',

  // 🔗 Links
  links: {
    canal: 'https://whatsapp.com/channel/...',
    grupo: 'https://chat.whatsapp.com/...',
    github: 'https://github.com/...',
    paypal: 'https://paypal.me/...'
  },

  // ⚙️ Configuración técnica
  sessionDir: './sessions',
  cacheTTL: 60000,
  publicMode: true,
  autoRead: false,

  // 💰 Economía
  currency: '💎',
  startBalance: 1000,

  // 🎨 Canvas
  welcome: {
    enabled: true,
    background: './assets/welcome-bg.jpg',
    color: '#FFFFFF'
  }
}

// Cargar config guardada o usar default
let savedConfig = {}
try {
  const { readFileSync } = await import('fs')
  savedConfig = JSON.parse(readFileSync('./bot-config.json', 'utf8'))
} catch {
  savedConfig = {}
}

// Merge configs
global.config = { ...defaultConfig, ...savedConfig }

global.saveConfig = async () => {
  const { writeFileSync } = await import('fs')
  const toSave = { ...global.config }
  delete toSave.owners
  delete toSave.sessionDir
  writeFileSync('./bot-config.json', JSON.stringify(toSave, null, 2))
}

// Mensajes globales (editables)
global.msgs = {
  admin: `⛔ *Permiso denegado*\n\n❌ Necesitas ser *administrador*.`,
  botAdmin: `🤖 *Necesito permisos*\n\n❌ Debo ser *administrador* del grupo.`,
  owner: `👑 *Acceso restringido*\n\n❌ Solo para *propietarios*.`,
  group: `👥 *Solo grupos*\n\n❌ Este comando solo funciona en grupos.`,
  private: `💬 *Solo privado*\n\n❌ Este comando solo funciona en privado.`,
  loading: `⏳ *Procesando...*`,
  error: `❌ *Error*\n\n⚠️ Ocurrió un problema.`,
  success: `✅ *Completado*`,
  disabled: `🚫 *Comando desactivado*\n\n❌ Este comando está desactivado.`
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.cyan("🔄 Config actualizada"))
  import(`${file}?update=${Date.now()}`)
})

export default global.config
