import { commands } from '../../lib/loader.js'
import { getUser } from '../../lib/database.js'

export const command = ['menu', 'help', 'comandos', 'ayuda']
export const description = 'Muestra el menú principal'
export const category = 'Info'

export async function run({ 
  sock, msg, chatId, reply, isGroup, isAdmin, isOwner, sender, usedPrefix 
}) {
  try {
    const user = getUser(sender)

    // Organizar comandos
    const cats = {}
    for (const [name, cmd] of commands) {
      if (cmd.owner && !isOwner) continue
      if (cmd.admin && !isAdmin && !isOwner) continue
      if (cmd.group && !isGroup) continue

      const cat = cmd.category || 'Otros'
      if (!cats[cat]) cats[cat] = []

      const exists = cats[cat].find(c => c.name === (Array.isArray(cmd.command) ? cmd.command[0] : cmd.command))
      if (!exists) {
        cats[cat].push({
          name: Array.isArray(cmd.command) ? cmd.command[0] : cmd.command,
          desc: cmd.description
        })
      }
    }

    // Header chido
    let menu = `
╔══════════════════════════════════════════╗
║                                          ║
║   🤖 ${global.config.botName.padEnd(32)}║
║   ⚡ Ultra Fast v${global.config.botVersion.padEnd(23)}║
║                                          ║
╚══════════════════════════════════════════╝

👤 *Usuario:* @${sender.split('@')[0]}
💎 *Dinero:* ${user.money.toLocaleString()}
⭐ *Nivel:* ${user.level} (${user.xp} XP)
📍 *Chat:* ${isGroup ? 'Grupo' : 'Privado'}
⏰ *Hora:* ${new Date().toLocaleTimeString()}

`

    // Categorías ordenadas
    const sortedCats = Object.keys(cats).sort()

    for (const cat of sortedCats) {
      menu += `┏━━━『 *${cat.toUpperCase()}* 』━━━┓
`

      for (const cmd of cats[cat]) {
        menu += `┃ ✦ ${usedPrefix}${cmd.name.padEnd(12)} ${cmd.desc.substring(0, 20)}${cmd.desc.length > 20 ? '..' : ''}
`
      }

      menu += `┗━━━━━━━━━━━━━━━━━━━━┛

`
    }

    // Footer
    menu += `╔══════════════════════════════════════════╗
║  💡 *Prefijo:* ${usedPrefix}                          ║
║  🔗 *Canal:* ${global.config.links?.canal ? 'Disponible' : 'No configurado'}              ║
║  👑 *Creado por:* Neyrox Team             ║
╚══════════════════════════════════════════╝

💡 *Tip:* Escribe ${usedPrefix}help <comando> para más info`

    await sock.sendMessage(chatId, {
      text: menu,
      mentions: [sender]
    }, { quoted: msg })

  } catch (error) {
    console.error('Error en menu:', error)
    await reply('❌ Error al generar el menú')
  }
}

export default { command, description, category, run }
