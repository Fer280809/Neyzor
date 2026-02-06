import { resolvePermissions } from './permissions.js'
import { getUser, getGroup, getSubBotConfig } from './database.js'
import chalk from 'chalk'

export async function handler(sock, msg, store, isSubBot = false, subBotId = null) {
  try {
    if (!msg.message || msg.key.fromMe) return

    const chatId = msg.key.remoteJid
    const isGroup = chatId.endsWith('@g.us')

    // Verificar si bot está apagado en este grupo
    if (isGroup) {
      const group = getGroup(chatId)

      // Verificar bot encendido/apagado
      if (group.botEnabled === false) {
        // Solo admins pueden encenderlo de nuevo
        const perms = await resolvePermissions(sock, msg, global.config)
        if (!perms.isAdmin && !perms.isOwner) {
          return // Silenciosamente ignorar
        }
      }

      // Verificar modo privado (solo grupos permitidos)
      let botMode = 'public'
      let allowedGroups = []

      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        botMode = subConfig.botMode || 'public'
        allowedGroups = subConfig.allowedGroups || []
      } else {
        botMode = global.db?.data?.settings?.botMode || 'public'
        allowedGroups = global.db?.data?.settings?.allowedGroups || []
      }

      if (botMode === 'private' && !allowedGroups.includes(chatId)) {
        const perms = await resolvePermissions(sock, msg, global.config)
        if (!perms.isOwner) {
          return // Ignorar en grupos no permitidos
        }
      }

      if (botMode === 'self') {
        const perms = await resolvePermissions(sock, msg, global.config)
        if (!perms.isOwner) {
          return // Solo owner en modo self
        }
      }
    }

    // Extraer texto
    let text = ''
    const messageType = Object.keys(msg.message)[0]

    if (messageType === 'conversation') {
      text = msg.message.conversation || ''
    } else if (messageType === 'extendedTextMessage') {
      text = msg.message.extendedTextMessage.text || ''
    } else if (messageType === 'imageMessage' && msg.message.imageMessage.caption) {
      text = msg.message.imageMessage.caption
    } else if (messageType === 'videoMessage' && msg.message.videoMessage.caption) {
      text = msg.message.videoMessage.caption
    }

    if (!text) return

    // Detectar prefijo
    let prefixes = ['.', '!', '#', '/', '-']

    if (isSubBot && subBotId) {
      const subConfig = getSubBotConfig(subBotId)
      if (subConfig.prefix) {
        prefixes = [subConfig.prefix]
      }
    }

    const hasPrefix = prefixes.includes(text[0])
    if (!hasPrefix && !global.config?.publicMode) return

    const usedPrefix = hasPrefix ? text[0] : ''
    const body = hasPrefix ? text.slice(1).trim() : text.trim()
    const args = body.split(' ').filter(arg => arg.length > 0)
    const commandName = args.shift()?.toLowerCase()

    if (!commandName) return

    // Buscar comando
    const command = findCommand(commandName)
    if (!command) return

    // Comandos protegidos
    const protectedCommands = ['owner', 'creador', 'grupos', 'grupo', 'serbot', 'bots', 'menu', 'help', 'toggle', 'setconfig', 'bot', 'boton', 'gruposcontrol']
    const isProtected = protectedCommands.includes(commandName)

    // Verificar usuario baneado
    const sender = msg.key.participant || msg.key.remoteJid
    const user = getUser(sender)
    if (user.banned && !global.config.owners.includes(sender.split('@')[0])) {
      return await sock.sendMessage(chatId, { text: '🚫 *Estás baneado*' }, { quoted: msg })
    }

    // Resolver permisos
    const perms = await resolvePermissions(sock, msg, global.config)

    // Verificar desactivación
    let disabled = false
    let disabledBy = ''

    // Global
    if (global.db?.data?.settings?.globalDisabledCommands?.includes(commandName)) {
      disabled = true
      disabledBy = 'globalmente'
    }

    // Grupo
    if (isGroup && !disabled) {
      const group = getGroup(chatId)
      if (group.disabledCommands?.includes(commandName)) {
        disabled = true
        disabledBy = 'en este grupo'
      }
      if (group.disabledCategories?.includes(command.category?.toLowerCase())) {
        disabled = true
        disabledBy = 'en este grupo (categoría)'
      }
    }

    // Sub-bot
    if (isSubBot && subBotId && !disabled && !isProtected) {
      const subConfig = getSubBotConfig(subBotId)
      if (subConfig.disabledCommands?.includes(commandName)) {
        disabled = true
        disabledBy = 'en este bot'
      }
      if (subConfig.disabledCategories?.includes(command.category?.toLowerCase())) {
        disabled = true
        disabledBy = 'en este bot (categoría)'
      }
    }

    if (disabled && !perms.isOwner) {
      return await sock.sendMessage(chatId, { 
        text: `🚫 *Comando desactivado ${disabledBy}*` 
      }, { quoted: msg })
    }

    console.log(chalk.cyan(`[CMD${isSubBot ? '-SUB' : ''}] ${commandName} | ${perms.senderNum}`))

    // Restricciones
    if (command.group && !perms.isGroup) {
      return await sock.sendMessage(chatId, { text: global.msgs.group }, { quoted: msg })
    }

    if (command.private && perms.isGroup) {
      return await sock.sendMessage(chatId, { text: global.msgs.private }, { quoted: msg })
    }

    if (command.admin && !perms.isAdmin && !perms.isOwner) {
      return await sock.sendMessage(chatId, { text: global.msgs.admin }, { quoted: msg })
    }

    if (command.botAdmin && !perms.isBotAdmin) {
      return await sock.sendMessage(chatId, { text: global.msgs.botAdmin }, { quoted: msg })
    }

    if (command.owner && !perms.isOwner) {
      return await sock.sendMessage(chatId, { text: global.msgs.owner }, { quoted: msg })
    }

    // Contexto
    const context = {
      sock, msg, chatId, sender: perms.sender, senderNum: perms.senderNum,
      args, text: args.join(' '), usedPrefix, command: commandName,
      isGroup, isAdmin: perms.isAdmin, isBotAdmin: perms.isBotAdmin, isOwner: perms.isOwner,
      groupMetadata: perms.groupMetadata, participants: perms.participants,
      user, store, isSubBot, subBotId,
      reply: async (text, options = {}) => {
        return await sock.sendMessage(chatId, { text }, { quoted: msg, ...options })
      },
      react: async (emoji) => {
        return await sock.sendMessage(chatId, { react: { text: emoji, key: msg.key }})
      },
      send: async (content, options = {}) => {
        return await sock.sendMessage(chatId, content, { ...options })
      }
    }

    // Ejecutar
    try {
      await command.run(context)
      user.commands++
    } catch (error) {
      console.error(chalk.red(`Error ${commandName}:`), error)
      await context.reply(`${global.msgs.error}\n💥 ${error.message}`)
    }

  } catch (error) {
    console.error(chalk.red('Handler error:'), error)
  }
}

function findCommand(name) {
  if (!global.commands) return null
  return global.commands.get(name) || null
}

export function reloadCommands() {
  if (global.commands) global.commands.clear()
}

export default handler
