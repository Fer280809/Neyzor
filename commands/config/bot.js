import { getGroup, getSubBotConfig, save, db } from '../../lib/database.js'
import { toJid, toNumber } from '../../lib/permissions.js'

export const command = ['bot', 'bottoggle', 'boton', 'botoff']
export const description = 'Activa/desactiva el bot global o en grupo'
export const category = 'Config'

export async function run({ 
  sock, msg, chatId, args, reply, isGroup, isOwner, isAdmin, isSubBot, subBotId 
}) {
  try {
    // Si no hay args, mostrar estado
    if (args.length === 0) {
      let text = `🤖 *ESTADO DEL BOT*

`

      // Estado global
      const globalEnabled = db.data.settings.botEnabled
      text += `🌍 *Global:* ${globalEnabled ? '✅ ON' : '❌ OFF'}
`

      // Estado en grupo
      if (isGroup) {
        const group = getGroup(chatId)
        text += `👥 *Este grupo:* ${group.botEnabled ? '✅ ON' : '❌ OFF'}
`
        if (group.allowedBy) {
          text += `👤 *Controlado por:* @${group.allowedBy}
`
        }
      }

      // Estado sub-bot
      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        text += `
🤖 *Tu Sub-Bot:*
`
        text += `• Grupos permitidos: ${subConfig.allowedGroups?.length || 0}
`
        text += `• Grupos bloqueados: ${subConfig.blockedGroups?.length || 0}
`
      }

      text += `
💡 *Uso:*
• *.bot* on/off (grupo actual)
• *.bot* global on/off (owner global)
• *.bot* allowgroup [id] (sub-bot/owner)
• *.bot* blockgroup [id] (sub-bot/owner)
• *.bot* mygroups (ver mis grupos permitidos)`

      return await reply(text)
    }

    const action = args[0].toLowerCase()

    // BOT GLOBAL ON/OFF (solo Owner)
    if (action === 'global') {
      if (!isOwner) {
        return await reply('⛔ *Solo el propietario puede controlar el bot global*')
      }

      const state = args[1]?.toLowerCase()
      if (state === 'on' || state === 'activar') {
        db.data.settings.botEnabled = true
        await save()
        return await reply('🌍 *BOT ACTIVADO GLOBALMENTE*\n\n✅ Todos pueden usar el bot ahora')
      } else if (state === 'off' || state === 'desactivar') {
        db.data.settings.botEnabled = false
        await save()
        return await reply('🌍 *BOT DESACTIVADO GLOBALMENTE*\n\n❌ Solo owners pueden usar comandos')
      } else {
        return await reply('⚠️ Usa: *.bot* global on/off')
      }
    }

    // BOT ON/OFF EN GRUPO (Admin/Owner)
    if (action === 'on' || action === 'off' || action === 'activar' || action === 'desactivar') {
      if (!isGroup) {
        return await reply('❌ *Este comando solo funciona en grupos*')
      }

      if (!isAdmin && !isOwner) {
        return await reply('⛔ *Necesitas ser admin*')
      }

      const enable = action === 'on' || action === 'activar'
      const group = getGroup(chatId)

      group.botEnabled = enable
      group.allowedBy = enable ? args.senderNum : null

      await save()

      return await reply(`${enable ? '✅' : '❌'} *Bot ${enable ? 'ACTIVADO' : 'DESACTIVADO'} en este grupo*\n\n${enable ? '✓ Todos pueden usar comandos' : '🚫 Nadie puede usar comandos (excepto quien lo apagó y owners)'}`)
    }

    // ALLOWGROUP - Permitir bot en grupo específico (Sub-bot/Owner)
    if (action === 'allowgroup' || action === 'permitir') {
      if (!isSubBot && !isOwner) {
        return await reply('⛔ *Solo sub-bots y owners pueden usar esto*')
      }

      let groupId = args[1]
      if (!groupId) {
        // Si es en grupo y no se especifica, usar grupo actual
        if (isGroup) {
          groupId = chatId
        } else {
          return await reply('⚠️ *Proporciona el ID del grupo o úsalo en un grupo*')
        }
      }

      if (!groupId.endsWith('@g.us')) {
        groupId = groupId + '@g.us'
      }

      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        if (!subConfig.allowedGroups) subConfig.allowedGroups = []

        if (!subConfig.allowedGroups.includes(groupId)) {
          subConfig.allowedGroups.push(groupId)
          // Quitar de bloqueados si estaba
          subConfig.blockedGroups = subConfig.blockedGroups?.filter(g => g !== groupId) || []
          await save()
        }

        return await reply(`✅ *Grupo permitido para tu sub-bot*\n\n🆔 ${groupId}\n\n💡 El bot solo funcionará en los grupos permitidos`)
      }

      // Si es owner, permitir en global
      if (isOwner) {
        const group = getGroup(groupId)
        group.botEnabled = true
        await save()
        return await reply(`✅ *Grupo permitido globalmente*\n\n🆔 ${groupId}`)
      }
    }

    // BLOCKGROUP - Bloquear grupo (Sub-bot/Owner)
    if (action === 'blockgroup' || action === 'bloquear') {
      if (!isSubBot && !isOwner) {
        return await reply('⛔ *Solo sub-bots y owners pueden usar esto*')
      }

      let groupId = args[1]
      if (!groupId) {
        if (isGroup) {
          groupId = chatId
        } else {
          return await reply('⚠️ *Proporciona el ID del grupo*')
        }
      }

      if (!groupId.endsWith('@g.us')) {
        groupId = groupId + '@g.us'
      }

      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        if (!subConfig.blockedGroups) subConfig.blockedGroups = []

        if (!subConfig.blockedGroups.includes(groupId)) {
          subConfig.blockedGroups.push(groupId)
          // Quitar de permitidos si estaba
          subConfig.allowedGroups = subConfig.allowedGroups?.filter(g => g !== groupId) || []
          await save()
        }

        return await reply(`🚫 *Grupo bloqueado para tu sub-bot*\n\n🆔 ${groupId}\n\n❌ El bot no funcionará aquí`)
      }

      if (isOwner) {
        const group = getGroup(groupId)
        group.botEnabled = false
        await save()
        return await reply(`🚫 *Grupo bloqueado globalmente*\n\n🆔 ${groupId}`)
      }
    }

    // MYGROUPS - Ver grupos permitidos del sub-bot
    if (action === 'mygroups' || action === 'misgrupos') {
      if (!isSubBot || !subBotId) {
        return await reply('⛔ *Solo para sub-bots*')
      }

      const subConfig = getSubBotConfig(subBotId)

      let text = `📋 *TUS GRUPOS CONFIGURADOS*

✅ *Permitidos:* ${subConfig.allowedGroups?.length || 0}
`
      if (subConfig.allowedGroups?.length > 0) {
        subConfig.allowedGroups.forEach((g, i) => {
          text += `${i + 1}. ${g}\n`
        })
      }

      text += `
❌ *Bloqueados:* ${subConfig.blockedGroups?.length || 0}
`
      if (subConfig.blockedGroups?.length > 0) {
        subConfig.blockedGroups.forEach((g, i) => {
          text += `${i + 1}. ${g}\n`
        })
      }

      text += `
💡 *Nota:* Si no hay grupos permitidos, el bot funciona en todos excepto los bloqueados`

      return await reply(text)
    }

    // REMOVEGROUP - Quitar grupo de lista
    if (action === 'removegroup' || action === 'quitar') {
      if (!isSubBot && !isOwner) {
        return await reply('⛔ *Solo sub-bots y owners*')
      }

      const groupId = args[1]?.endsWith('@g.us') ? args[1] : args[1] + '@g.us'
      if (!groupId) return await reply('⚠️ *Proporciona el ID del grupo*')

      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        subConfig.allowedGroups = subConfig.allowedGroups?.filter(g => g !== groupId) || []
        subConfig.blockedGroups = subConfig.blockedGroups?.filter(g => g !== groupId) || []
        await save()
        return await reply(`✅ *Grupo removido de tus listas*\n\n🆔 ${groupId}`)
      }
    }

    await reply('⚠️ *Acción no válida*\n\nUsa *.bot* para ver opciones')

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, run }
