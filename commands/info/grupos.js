export const command = ['grupos', 'groups', 'chats', 'listgroups']
export const description = 'Muestra todos los grupos donde está el bot'
export const category = 'Info'
export const owner = true

export async function run({ sock, reply }) {
  try {
    const chats = Object.values(sock.chats || {})
    const groups = chats.filter(chat => chat.id?.endsWith('@g.us'))

    if (groups.length === 0) {
      return await reply('📭 *No estoy en ningún grupo*')
    }

    let text = `📊 *GRUPOS DONDE ESTOY*

`
    text += `📱 *Total:* ${groups.length} grupos

`

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      const subject = group.subject || 'Sin nombre'
      const participants = group.participants?.length || 0
      const id = group.id

      text += `${i + 1}. *${subject}*
`
      text += `   👥 ${participants} miembros
`
      text += `   🆔 ${id}

`
    }

    text += `💡 *Para salir de un grupo:*
`
    text += `*.leave* [número] o *.leave* [id]`

    await reply(text)

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, owner, run }
