import { createWelcomeImage, createGoodbyeImage } from '../lib/canvas.js'
import { getGroup } from '../lib/database.js'
import { downloadProfilePicture } from '../lib/utils.js'

export const name = 'welcome'

export async function run({ sock, update }) {
  const { id, participants, action } = update

  try {
    const group = getGroup(id)
    if (!group.welcome) return

    const groupMetadata = await sock.groupMetadata(id)
    const groupName = groupMetadata.subject
    const memberCount = groupMetadata.participants.length

    if (action === 'add') {
      for (const user of participants) {
        try {
          // Intentar obtener foto de perfil
          let avatarBuffer = null
          try {
            avatarBuffer = await downloadProfilePicture(sock, user)
          } catch {}

          // Obtener nombre
          const userName = await sock.getName(user) || 'Usuario'
          const userNumber = user.split('@')[0]

          // Generar imagen
          const imageBuffer = await createWelcomeImage(
            userName, userNumber, groupName, avatarBuffer, memberCount
          )

          // Enviar
          await sock.sendMessage(id, {
            image: imageBuffer,
            caption: `👋 *Bienvenido* @${userNumber}\n\n📍 *${groupName}*\n👥 Eres el miembro #${memberCount}\n\n📝 Lee las reglas y disfruta!`,
            mentions: [user]
          })

        } catch (err) {
          // Fallback si canvas falla
          await sock.sendMessage(id, {
            text: `👋 *Bienvenido* @${user.split('@')[0]}\n\n📍 *${groupName}*\n\n📝 Lee las reglas!`,
            mentions: [user]
          })
        }
      }

    } else if (action === 'remove') {
      for (const user of participants) {
        try {
          const userName = await sock.getName(user) || 'Usuario'
          const userNumber = user.split('@')[0]
          const remainingCount = groupMetadata.participants.length - 1

          const imageBuffer = await createGoodbyeImage(
            userName, userNumber, groupName, remainingCount
          )

          await sock.sendMessage(id, {
            image: imageBuffer,
            caption: `👋 *Hasta luego* @${userNumber}\n\nEsperamos verte pronto!`,
            mentions: [user]
          })

        } catch {
          await sock.sendMessage(id, {
            text: `👋 *Adiós* @${user.split('@')[0]}`,
            mentions: [user]
          })
        }
      }
    }

  } catch (error) {
    console.error('Error welcome event:', error)
  }
}

export default { name, run }
