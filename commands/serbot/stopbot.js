import { removeSubBot, getSubBots } from '../../lib/serbot.js'

export const command = ['stopbot', 'detenerbot', 'unbot']
export const description = 'Detiene tu sub-bot activo'
export const category = 'SerBot'

export async function run({ sock, msg, chatId, senderNum, reply }) {
  try {
    const subBots = getSubBots()

    let userSubBot = null
    for (const [id, bot] of subBots) {
      if (bot.user?.id?.includes(senderNum)) {
        userSubBot = id
        break
      }
    }

    if (!userSubBot) {
      return await reply('❌ *No tienes un sub-bot activo*

💡 Usa *.serbot* para crear uno')
    }

    await reply('⏳ *Deteniendo sub-bot...*')

    const removed = await removeSubBot(userSubBot)

    if (removed) {
      await reply('✅ *Sub-bot detenido correctamente*')
    } else {
      await reply('❌ *No se pudo detener*')
    }

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, run }
