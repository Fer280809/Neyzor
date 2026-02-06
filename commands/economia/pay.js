import { getUser, save } from '../../lib/database.js'
import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['pay', 'pagar', 'transfer', 'dar']
export const description = 'Transfiere dinero a otro usuario'
export const category = 'Economia'

export async function run({ sock, msg, chatId, args, reply, sender, senderNum }) {
  try {
    let targetJid = null

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      targetJid = msg.message.extendedTextMessage.contextInfo.participant
    } else if (args.length >= 2) {
      const num = args[0].replace(/[^0-9]/g, '')
      if (num.length >= 10) {
        targetJid = num + '@s.whatsapp.net'
        args.shift()
      }
    }

    if (!targetJid) {
      return await reply(`⚠️ *Menciona a alguien o proporciona número*

💡 Ejemplos:
• *.pay* @usuario 1000
• *.pay* 521234567890 5000
• *.pay* (respondiendo) 1000`)
    }

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    if (targetJid === sender) {
      return await reply('❌ *No puedes transferirte a ti mismo*')
    }

    const amount = parseInt(args[args.length - 1]) || parseInt(args[0])

    if (!amount || isNaN(amount) || amount <= 0) {
      return await reply('⚠️ *Proporciona una cantidad válida*

💡 Ejemplo: *.pay* @usuario 1000')
    }

    const user = getUser(sender)

    if (user.money < amount) {
      return await reply(`❌ *Saldo insuficiente*

💰 Tu saldo: ${global.config.currency} ${user.money.toLocaleString()}
💸 Necesitas: ${global.config.currency} ${amount.toLocaleString()}`)
    }

    const target = getUser(targetJid)

    user.money -= amount
    target.money += amount

    await save()

    await reply(`✅ *TRANSFERENCIA EXITOSA*

👤 *De:* @${senderNum}
👤 *Para:* @${targetNum}
💰 *Cantidad:* ${global.config.currency} ${amount.toLocaleString()}

💵 Tu nuevo saldo: ${global.config.currency} ${user.money.toLocaleString()}`, {
      mentions: [sender, targetJid]
    })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, run }
