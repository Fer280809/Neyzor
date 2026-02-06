import { getUser } from '../../lib/database.js'

export const command = ['balance', 'bal', 'dinero', 'money', 'wallet']
export const description = 'Muestra tu dinero'
export const category = 'Economia'

export async function run({ sock, msg, chatId, sender, senderNum, reply }) {
  const user = getUser(sender)

  await reply(`💰 *TU BALANCE*

👤 @${senderNum}
💵 Efectivo: ${global.config.currency} ${user.money.toLocaleString()}
🏦 Banco: ${global.config.currency} ${user.bank.toLocaleString()}
📊 Total: ${global.config.currency} ${(user.money + user.bank).toLocaleString()}
⭐ Nivel: ${user.level} (${user.xp} XP)`, {
    mentions: [sender]
  })
}

export default { command, description, category, run }
