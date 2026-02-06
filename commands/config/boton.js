import { getGroup, save } from '../../lib/database.js'

export const command = ['bot', 'boton', 'botoff']
export const description = 'Enciende o apaga el bot en el grupo'
export const category = 'Config'
export const admin = true
export const group = true

export async function run({ chatId, args, reply, command: cmdName }) {
  try {
    const group = getGroup(chatId)

    // Si no hay argumentos, mostrar estado
    if (args.length === 0) {
      const status = group.botEnabled !== false ? '✅ ENCENDIDO' : '❌ APAGADO'
      return await reply(`🤖 *ESTADO DEL BOT*

${status}

💡 Usa *.bot* on/off para cambiar`)
    }

    const option = args[0].toLowerCase()

    if (option === 'on' || option === 'encender' || cmdName === 'boton') {
      group.botEnabled = true
      await save()
      return await reply(`✅ *BOT ENCENDIDO*

🤖 El bot ahora responde en este grupo`)
    }

    if (option === 'off' || option === 'apagar' || cmdName === 'botoff') {
      group.botEnabled = false
      await save()
      return await reply(`❌ *BOT APAGADO*

😴 El bot no responderá en este grupo

💡 Los admins pueden usar *.bot on* para encender`)
    }

    await reply('⚠️ Usa *.bot* on/off')

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, group, run }
