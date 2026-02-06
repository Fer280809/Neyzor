import { getGroup, getSubBotConfig, save } from '../../lib/database.js'
import { commands } from '../../lib/loader.js'

export const command = ['toggle', 'enable', 'disable', 'switch', 'on', 'off']
export const description = 'Activa/desactiva comandos y categorías'
export const category = 'Config'
export const admin = true

export async function run({ 
  chatId, args, reply, isGroup, isOwner, isSubBot, subBotId 
}) {
  try {
    // Comandos protegidos que no se pueden desactivar
    const protectedCommands = ['owner', 'creador', 'grupos', 'grupo', 'serbot', 'bots', 'menu', 'help', 'toggle', 'setconfig']

    if (args.length === 0) {
      // Mostrar estado actual
      let disabledCmds = []
      let disabledCats = []

      if (isGroup) {
        const group = getGroup(chatId)
        disabledCmds = group.disabledCommands || []
        disabledCats = group.disabledCategories || []
      }

      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        disabledCmds = [...new Set([...disabledCmds, ...(subConfig.disabledCommands || [])])]
        disabledCats = [...new Set([...disabledCats, ...(subConfig.disabledCategories || [])])]
      }

      let text = `⚙️ *TOGGLE - ESTADO ACTUAL*

📋 *Comandos desactivados:*
${disabledCmds.length > 0 ? disabledCmds.map(c => `  ❌ ${c}`).join('\n') : '  _Ninguno_'}

📁 *Categorías desactivadas:*
${disabledCats.length > 0 ? disabledCats.map(c => `  ❌ ${c}`).join('\n') : '  _Ninguna_'}

💡 *Uso:*
• *.toggle* off kick (desactiva en este grupo/bot)
• *.toggle* on kick (activa)
• *.toggle* offcat economia (desactiva categoría)
• *.toggle* global off kick (desactiva global - owner)
• *.toggle* list (ver todos los comandos)`

      return await reply(text)
    }

    // Detectar si es global
    let isGlobal = false
    let actionIndex = 0

    if (args[0].toLowerCase() === 'global') {
      isGlobal = true
      actionIndex = 1

      if (!isOwner) {
        return await reply('⛔ *Solo el propietario puede usar toggle global*')
      }
    }

    const action = args[actionIndex]?.toLowerCase() // on, off, oncat, offcat
    const target = args[actionIndex + 1]?.toLowerCase()

    // Listar comandos
    if (action === 'list' || action === 'lista') {
      const cats = {}
      for (const [name, cmd] of commands) {
        const cat = cmd.category || 'Otros'
        if (!cats[cat]) cats[cat] = []
        if (!cats[cat].includes(name)) cats[cat].push(name)
      }

      let text = `📋 *COMANDOS DISPONIBLES*\n\n`
      for (const [cat, cmds] of Object.entries(cats).sort()) {
        text += `*${cat}:* ${cmds.slice(0, 8).join(', ')}${cmds.length > 8 ? ` (+${cmds.length - 8})` : ''}\n`
      }
      return await reply(text)
    }

    if (!action || !target) {
      return await reply('⚠️ *Uso:* .toggle [global] on/off/comando')
    }

    // Verificar si es comando protegido
    if (protectedCommands.includes(target)) {
      return await reply(`🚫 *No puedes desactivar el comando ${target}*\n\nEste comando es esencial para el funcionamiento.`)
    }

    // TOGGLE GLOBAL (Owner only)
    if (isGlobal) {
      if (!global.db?.data?.settings) {
        global.db.data.settings = { globalDisabledCommands: [], globalDisabledCategories: [] }
      }

      const settings = global.db.data.settings

      if (action === 'off') {
        if (!settings.globalDisabledCommands.includes(target)) {
          settings.globalDisabledCommands.push(target)
        }
        await save()
        return await reply(`🌍 *${target} desactivado GLOBALMENTE*\n\n❌ Nadie podrá usar este comando en ningún lado`)
      } 

      if (action === 'on') {
        settings.globalDisabledCommands = settings.globalDisabledCommands.filter(c => c !== target)
        await save()
        return await reply(`🌍 *${target} activado GLOBALMENTE*\n\n✅ Todos pueden usarlo`)
      }

      if (action === 'offcat' || action === 'offcategoria') {
        if (!settings.globalDisabledCategories.includes(target)) {
          settings.globalDisabledCategories.push(target)
        }
        await save()
        return await reply(`🌍 *Categoría ${target} desactivada GLOBALMENTE*`)
      }

      if (action === 'oncat' || action === 'oncategoria') {
        settings.globalDisabledCategories = settings.globalDisabledCategories.filter(c => c !== target)
        await save()
        return await reply(`🌍 *Categoría ${target} activada GLOBALMENTE*`)
      }
    }

    // TOGGLE GRUPO
    if (isGroup) {
      const group = getGroup(chatId)

      if (action === 'off') {
        if (!group.disabledCommands.includes(target)) {
          group.disabledCommands.push(target)
        }
        await save()
        return await reply(`✅ *${target} desactivado en este grupo*\n\n🚫 Los miembros no podrán usarlo`)
      }

      if (action === 'on') {
        group.disabledCommands = group.disabledCommands.filter(c => c !== target)
        await save()
        return await reply(`✅ *${target} activado en este grupo*\n\n✓ Ahora funciona normalmente`)
      }

      if (action === 'offcat' || action === 'offcategoria') {
        if (!group.disabledCategories.includes(target)) {
          group.disabledCategories.push(target)
        }
        await save()
        return await reply(`✅ *Categoría ${target} desactivada en este grupo*`)
      }

      if (action === 'oncat' || action === 'oncategoria') {
        group.disabledCategories = group.disabledCategories.filter(c => c !== target)
        await save()
        return await reply(`✅ *Categoría ${target} activada en este grupo*`)
      }
    }

    // TOGGLE SUB-BOT (solo para el dueño del sub-bot)
    if (isSubBot && subBotId) {
      const subConfig = getSubBotConfig(subBotId)

      if (action === 'off') {
        if (!subConfig.disabledCommands.includes(target)) {
          subConfig.disabledCommands.push(target)
        }
        await save()
        return await reply(`🤖 *${target} desactivado en tu sub-bot*\n\n🚫 Nadie podrá usarlo en tu bot`)
      }

      if (action === 'on') {
        subConfig.disabledCommands = subConfig.disabledCommands.filter(c => c !== target)
        await save()
        return await reply(`🤖 *${target} activado en tu sub-bot*`)
      }

      if (action === 'offcat' || action === 'offcategoria') {
        if (!subConfig.disabledCategories.includes(target)) {
          subConfig.disabledCategories.push(target)
        }
        await save()
        return await reply(`🤖 *Categoría ${target} desactivada en tu sub-bot*`)
      }

      if (action === 'oncat' || action === 'oncategoria') {
        subConfig.disabledCategories = subConfig.disabledCategories.filter(c => c !== target)
        await save()
        return await reply(`🤖 *Categoría ${target} activada en tu sub-bot*`)
      }
    }

    await reply('⚠️ *Uso incorrecto*\n\n💡 *.toggle* on/off/comando')

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, run }
