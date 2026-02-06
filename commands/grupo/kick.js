import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['kick', 'echar', 'ban', 'sacar', 'remove']
export const description = 'Expulsa a un usuario del grupo'
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

    if (!targetJid) {
      return await reply(`⚠️ *Menciona a alguien o responde a su mensaje*

💡 Ejemplo: *.kick* @usuario`)
    }

    targetJid = toJid(targetJid)
    const targetNum = toNumber(targetJid)

    const botJid = sock.user?.jid || sock.user?.id
    if (targetJid === toJid(botJid)) {
      return await reply('❌ *No puedo expulsarme a mí mismo*')
    }

    const groupMetadata = await sock.groupMetadata(chatId)
    if (targetJid === groupMetadata.owner) {
      return await reply('❌ *No puedo expulsar al propietario*')
    }

    const participant = groupMetadata.participants.find(p => p.id === targetJid)
    if (participant?.admin) {
      return await reply('❌ *No puedo expulsar a un administrador*')
    }

    await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove')

    await reply(`✅ *Usuario expulsado*

👤 @${targetNum} ha sido removido`, {
      mentions: [targetJid]
    })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, botAdmin, group, run }
