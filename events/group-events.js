import { toNumber } from '../lib/permissions.js'

export const name = 'group-events'

export async function run({ sock, update }) {
  try {
    // group-participants.update ya está manejado en welcome.js
    // Aquí manejamos groups.update (cambios en configuración)

    if (update[0]) {
      const { id, subject, desc, restrict, announce, ephemeralDuration } = update[0]

      if (!id) return

      let message = `📢 *Actualización del Grupo*\n\n`

      if (subject) {
        message += `📝 *Nuevo nombre:* ${subject}\n`
      }

      if (desc) {
        message += `📄 *Nueva descripción:* ${desc}\n`
      }

      if (restrict !== undefined) {
        message += `🔒 *Edición de info:* ${restrict ? 'Solo admins' : 'Todos'}\n`
      }

      if (announce !== undefined) {
        message += `📢 *Mensajes:* ${announce ? 'Solo admins' : 'Todos'}\n`
      }

      // Enviar notificación
      await sock.sendMessage(id, { text: message.trim() })
    }

  } catch (error) {
    console.error('Error group-events:', error)
  }
}

export default { name, run }
