import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 60 })

export function toJid(jid = '') {
  if (!jid) return null
  return jid.split('@')[0].split(':')[0] + '@s.whatsapp.net'
}

export function toNumber(jid = '') {
  if (!jid) return ''
  return jid.split('@')[0].split(':')[0]
}

export async function resolvePermissions(sock, msg, cfg = global.config) {
  const chatId = msg.key?.remoteJid || msg.chat
  const isGroup = chatId?.endsWith('@g.us') || false

  let senderRaw = isGroup ? (msg.key?.participant || msg.participant) : chatId
  let sender = toJid(senderRaw)
  if (!sender && msg.sender) sender = toJid(msg.sender)

  let isAdmin = false
  let isBotAdmin = false
  let groupMetadata = null
  let participants = []

  if (isGroup) {
    try {
      const cached = cache.get(chatId)
      if (cached && Date.now() - cached.time < (cfg.cacheTTL || 60000)) {
        groupMetadata = cached.data
      } else {
        groupMetadata = await sock.groupMetadata(chatId)
        cache.set(chatId, { data: groupMetadata, time: Date.now() })
      }

      participants = groupMetadata?.participants || []
      const botRaw = sock.user?.jid || sock.user?.id || sock.authState?.creds?.me?.id
      const bot = toJid(botRaw)
      const botNum = toNumber(bot)
      const senderNum = toNumber(sender)

      for (const p of participants) {
        const pNum = toNumber(p.id)
        const isParticipantAdmin = p.admin === 'admin' || p.admin === 'superadmin'
        if (pNum === senderNum) isAdmin = isParticipantAdmin
        if (pNum === botNum) isBotAdmin = isParticipantAdmin
      }
    } catch (error) {
      console.error('Error permisos:', error.message)
    }
  }

  const senderNum = toNumber(sender)
  const isOwner = (cfg.owners || []).includes(senderNum)

  return {
    chatId, sender, senderNum, isGroup, isOwner, isAdmin, isBotAdmin,
    groupMetadata, participants
  }
}

export function invalidateCache(chatId) {
  cache.del(chatId)
}

export default { resolvePermissions, toJid, toNumber, invalidateCache }
