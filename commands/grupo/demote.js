import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['demote', 'quitaradmin', 'rmadmin']
export const description = 'Revoca privilegios de administrador'
export const category = 'Grupo'
export const admin = true
export const botAdmin = true
export const group = true

export async function run({ sock, msg, chatId, args, reply }) {
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

    if (!targetJid) return await reply('⚠️ *Menciona a alguien*')

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    await sock.groupParticipantsUpdate(chatId, [targetJid], 'demote')

    await reply(`⚠️ *Administrador removido*

👤 @${targetNum} ya no es admin`, {
      mentions: [targetJid]
    })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, botAdmin, group, run }
