export const command = ['tagall', 'todos', 'all']
export const description = 'Menciona a todos los miembros'
export const category = 'Grupo'
export const admin = true
export const group = true

export async function run({ sock, msg, chatId, args, reply }) {
  try {
    const groupMetadata = await sock.groupMetadata(chatId)
    const participants = groupMetadata.participants

    const message = args.length > 0 ? args.join(' ') : '👋 Atención a todos!'

    let tagText = `📢 *${message}*

`
    const mentions = []

    for (const participant of participants) {
      const num = participant.id.split('@')[0]
      tagText += `@${num} `
      mentions.push(participant.id)
    }

    await sock.sendMessage(chatId, {
      text: tagText,
      mentions: mentions
    }, { quoted: msg })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, admin, group, run }
