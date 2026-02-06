export const command = ['ping', 'status', 'estado']
export const description = 'Verifica estado del bot'
export const category = 'Info'

export async function run({ reply }) {
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const mins = Math.floor((uptime % 3600) / 60)
  const secs = Math.floor(uptime % 60)

  await reply(`🏓 *PONG!*

⏱️ Uptime: ${hours}h ${mins}m ${secs}s
💻 Node: ${process.version}
🤖 *${global.config.botName}* activo!`)
}

export default { command, description, category, run }
