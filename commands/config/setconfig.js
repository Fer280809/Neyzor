import { getGroup, getSubBotConfig, save } from '../../lib/database.js'

export const command = ['setconfig', 'config', 'set', 'setting']
export const description = 'Configura el bot (Owner/Admin)'
export const category = 'Config'
export const admin = true

export async function run({ 
  sock, msg, chatId, args, reply, isGroup, isAdmin, isOwner, 
  isSubBot, subBotId 
}) {
  try {
    if (args.length === 0) {
      let text = `⚙️ *CONFIGURACIÓN DEL BOT*

*Comandos disponibles:*

👑 *Owner Global:*
• *.setconfig* name NuevoNombre
• *.setconfig* desc Nueva descripción  
• *.setconfig* prefix .
• *.setconfig* canal https://...
• *.setconfig* grupo https://...
• *.setconfig* github https://...
• *.setconfig* logo ./assets/logo.jpg

👥 *Admin de Grupo:*
• *.setconfig* welcome on/off
• *.setconfig* antilink on/off
• *.setconfig* antispam on/off

🤖 *Sub-Bot (Propio):*
• *.setconfig* myname MiBot
• *.setconfig* myprefix !

💡 *Ver config actual:*
• *.setconfig* view`

      return await reply(text)
    }

    const option = args[0].toLowerCase()
    const value = args.slice(1).join(' ')

    // Ver config actual
    if (option === 'view' || option === 'ver') {
      let text = `⚙️ *CONFIGURACIÓN ACTUAL*

🤖 *Bot Global:*
• Nombre: ${global.config.botName}
• Prefijo: ${global.config.prefix || '.'}
• Descripción: ${global.config.botDesc}

🔗 *Links:*
• Canal: ${global.config.links?.canal || 'No configurado'}
• Grupo: ${global.config.links?.grupo || 'No configurado'}
• GitHub: ${global.config.links?.github || 'No configurado'}
`

      if (isGroup) {
        const group = getGroup(chatId)
        text += `
👥 *Este Grupo:*
• Bienvenida: ${group.welcome ? '✅' : '❌'}
• Anti-Link: ${group.antilink ? '✅' : '❌'}
• Anti-Spam: ${group.antispam ? '✅' : '❌'}
`
      }

      if (isSubBot && subBotId) {
        const subConfig = getSubBotConfig(subBotId)
        text += `
🤖 *Tu Sub-Bot:*
• Nombre: ${subConfig.botName || 'Default'}
• Prefijo: ${subConfig.prefix}
• Comandos desactivados: ${subConfig.disabledCommands?.length || 0}
• Categorías desactivadas: ${subConfig.disabledCategories?.length || 0}
`
      }

      return await reply(text)
    }

    // Configuración GLOBAL (solo Owner)
    if (['name', 'nombre', 'desc', 'descripcion', 'prefix', 'canal', 'grupo', 'github', 'logo'].includes(option)) {
      if (!isOwner) {
        return await reply('⛔ *Solo el propietario puede cambiar la configuración global*')
      }

      if (!value) return await reply(`⚠️ Proporciona un valor para ${option}`)

      switch(option) {
        case 'name':
        case 'nombre':
          global.config.botName = value
          break
        case 'desc':
        case 'descripcion':
          global.config.botDesc = value
          break
        case 'prefix':
          global.config.prefix = value
          break
        case 'canal':
          global.config.links.canal = value
          break
        case 'grupo':
          global.config.links.grupo = value
          break
        case 'github':
          global.config.links.github = value
          break
        case 'logo':
          global.config.botLogo = value
          break
      }

      await global.saveConfig()
      return await reply(`✅ *Configuración actualizada:*\n\n${option}: ${value}`)
    }

    // Configuración de GRUPO (Admin)
    if (isGroup && ['welcome', 'bienvenida', 'antilink', 'antispam'].includes(option)) {
      const group = getGroup(chatId)
      const enable = value === 'on' || value === 'activar' || value === 'true'
      const disable = value === 'off' || value === 'desactivar' || value === 'false'

      if (!enable && !disable) {
        return await reply('⚠️ Usa *on* o *off*')
      }

      if (option === 'welcome' || option === 'bienvenida') {
        group.welcome = enable
      } else if (option === 'antilink') {
        group.antilink = enable
      } else if (option === 'antispam') {
        group.antispam = enable
      }

      await save()
      return await reply(`✅ *${option}* ${enable ? 'activado' : 'desactivado'} en este grupo`)
    }

    // Configuración de SUB-BOT (Usuario del sub-bot)
    if (isSubBot && subBotId && ['myname', 'myprefix', 'minombre', 'miprefijo'].includes(option)) {
      const subConfig = getSubBotConfig(subBotId)

      if (option === 'myname' || option === 'minombre') {
        if (!value) return await reply('⚠️ Proporciona un nombre')
        subConfig.botName = value
      } else if (option === 'myprefix' || option === 'miprefijo') {
        if (!value || value.length > 3) return await reply('⚠️ Prefijo máximo 3 caracteres')
        subConfig.prefix = value
      }

      await save()
      return await reply(`✅ *Configuración de tu sub-bot actualizada*\n\nReinicia el bot para aplicar cambios`)
    }

    await reply('⚠️ *Opción no válida*\n\nUsa *.setconfig* para ver opciones')

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, run }
