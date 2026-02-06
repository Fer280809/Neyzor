import { getUser, save } from '../../lib/database.js'
import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['rob', 'robar', 'steal', 'quitar']
export const description = 'Intenta robar dinero (50% éxito)'
export const category = 'Economia'

export async function run({ sock, msg, chatId, args, reply, sender, senderNum }) {
  try {
    let targetJid = null

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      targetJid = msg.message.extendedTextMessage.contextInfo.participant
    } else if (args.length > 0) {
      const num = args[0].replace(/[^0-9]/g, '')
      if (num.length >= 10) targetJid = num + '@s.whatsapp.net'
    }

    if (!targetJid) {
      return await reply(`⚠️ *Menciona a alguien para robar*

💡 Ejemplo: *.rob* @usuario`)
    }

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    if (targetJid === sender) {
      return await reply('❌ *No puedes robarte a ti mismo*')
    }

    const user = getUser(sender)
    const target = getUser(targetJid)

    if (target.money <= 0) {
      return await reply('❌ *Este usuario no tiene dinero*')
    }

    // Cooldown de 5 minutos
    const now = Date.now()
    if (user.lastRob && now - user.lastRob < 5 * 60 * 1000) {
      const remaining = Math.ceil((5 * 60 * 1000 - (now - user.lastRob)) / 1000)
      const mins = Math.floor(remaining / 60)
      const secs = remaining % 60
      return await reply(`⏳ *Espera ${mins}m ${secs}s para volver a robar*`)
    }

    user.lastRob = now

    // 50% éxito
    const success = Math.random() >= 0.5
    const maxSteal = Math.floor(target.money * 0.3)
    const amount = Math.floor(Math.random() * maxSteal) + 1

    if (success) {
      target.money -= amount
      user.money += amount
      await save()

      await reply(`🎉 *¡ROBO EXITOSO!*

👤 *Víctima:* @${targetNum}
💰 *Robado:* ${global.config.currency} ${amount.toLocaleString()}

💵 Tu saldo: ${global.config.currency} ${user.money.toLocaleString()}`, {
        mentions: [targetJid]
      })
    } else {
      const fine = Math.floor(Math.random() * 500) + 100
      user.money = Math.max(0, user.money - fine)
      await save()

      await reply(`🚔 *¡TE ATRAPARON!*

👮 La policía te descubrió
💸 *Multa:* ${global.config.currency} ${fine.toLocaleString()}

💵 Tu saldo: ${global.config.currency} ${user.money.toLocaleString()}`, {
        mentions: [targetJid]
      })
    }

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, run }
