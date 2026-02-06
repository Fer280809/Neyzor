import { 
  getSubBots, removeSubBot, restartSubBot, 
  restartAllSubBots, removeAllSubBots, getSubBotStats 
} from '../../lib/serbot.js'

export const command = ['bots', 'subbots', 'serbots']
export const description = 'Gestiona los sub-bots (Owner)'
export const category = 'SerBot'
export const owner = true

export async function run({ args, reply }) {
  try {
    if (args.length === 0) {
      // Mostrar lista
      const stats = getSubBotStats()

      let text = `🤖 *SUB-BOTS ACTIVOS*

📊 *Estadísticas:*
• Total: ${stats.total}
• Conectados: ${stats.connected}
• Reconectando: ${stats.reconnecting}

📱 *Lista:*
`

      if (stats.list.length === 0) {
        text += '_No hay sub-bots activos_'
      } else {
        for (const bot of stats.list) {
          text += `
🆔 ${bot.sessionId}
📱 ${bot.number}
👤 ${bot.name || 'Unknown'}
📡 ${bot.status}
⏰ ${new Date(bot.connectedAt).toLocaleTimeString()}
`
        }
      }

      text += `

💡 *Comandos:*
• *.bots restart* - Reiniciar todos
• *.bots stop* - Detener todos
• *.bots restart <id>* - Reiniciar específico
• *.bots stop <id>* - Detener específico`

      return await reply(text)
    }

    const action = args[0].toLowerCase()
    const targetId = args[1]

    if (action === 'restart') {
      if (targetId) {
        await reply(`🔄 *Reiniciando ${targetId}...*`)
        const success = await restartSubBot(targetId)
        await reply(success ? '✅ *Reiniciado*' : '❌ *Error*')
      } else {
        await reply('🔄 *Reiniciando TODOS los sub-bots...*')
        const results = await restartAllSubBots()
        const success = results.filter(r => r.success).length
        await reply(`✅ *${success}/${results.length} reiniciados*`)
      }

    } else if (action === 'stop' || action === 'delete') {
      if (targetId) {
        await reply(`🛑 *Deteniendo ${targetId}...*`)
        const success = await removeSubBot(targetId)
        await reply(success ? '✅ *Detenido*' : '❌ *Error*')
      } else {
        await reply('🛑 *Deteniendo TODOS los sub-bots...*')
        await removeAllSubBots()
        await reply('✅ *Todos los sub-bots detenidos*')
      }

    } else {
      await reply('⚠️ *Acción no válida*

Usa: restart, stop')
    }

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, owner, run }
