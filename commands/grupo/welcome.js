import { getGroup, save } from '../../lib/database.js'

export const command = ['welcome', 'bienvenida']
export const description = 'Activa o desactiva la bienvenida'
export const category = 'Grupo'
export const admin = true
export const group = true

export async function run({ chatId, args, reply }) {
  try {
    const group = getGroup(chatId)

    if (args.length === 0) {
      const status = group.welcome ? '✅ Activada' : '❌ Desactivada'
      return await reply(`👋 *Bienvenida*

Estado: ${status}

💡 Usa *.welcome on* o *.welcome off*`)
    }

    const option = args[0].toLowerCase()

    if (option === 'on' || option === 'activar') {
      group.welcome = true
      await save()
      await reply('✅ *Bienvenida activada*

🎨 Se enviarán imágenes personalizadas')
    } else if (option === 'off' || option === 'desactivar') {
      group.welcome = false
      await save()
      await reply('❌ *Bienvenida desactivada*')
    } else {
      await reply('⚠️ Usa *on* o *off*')
    }

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, group, run }
