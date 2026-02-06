import { toNumber } from '../lib/permissions.js'

export const name = 'admin-notify'

export async function run({ sock, update }) {
  // Este evento se ejecuta cuando hay cambios de admin
  // Baileys lo envía como group-participants.update con action: 'promote' o 'demote'

  const { id, participants, action } = update

  if (action !== 'promote' && action !== 'demote') return

  try {
    for (const user of participants) {
      const num = toNumber(user)

      if (action === 'promote') {
        await sock.sendMessage(id, {
          text: `👑 *Nuevo Administrador*\n\n🎉 @${num} ahora es admin del grupo`,
          mentions: [user]
        })
      } else {
        await sock.sendMessage(id, {
          text: `⚠️ *Administrador Removido*\n\n😔 @${num} ya no es admin`,
          mentions: [user]
        })
      }
    }
  } catch (error) {
    console.error('Error admin-notify:', error)
  }
}

export default { name, run }
