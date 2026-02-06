import { createSubBot } from '../../lib/serbot.js'

export const command = ['serbot', 'jadibot', 'qr', 'code']
export const description = 'Vincula este número como sub-bot'
export const category = 'SerBot'
export const private = true

export async function run({ sock, msg, chatId, args, command: cmdName, reply, senderNum }) {
  try {
    let mode = 'qr'
    let phoneNumber = null

    if (cmdName === 'code' || args[0] === 'code') {
      mode = 'code'
      if (args[0] === 'code' && args[1]) {
        phoneNumber = args[1]
      } else if (args[0] && args[0] !== 'code') {
        phoneNumber = args[0]
      } else {
        phoneNumber = senderNum
      }
    }

    await reply(`⏳ *Iniciando modo ${mode.toUpperCase()}...*

🔄 Generando...`)

    const result = await createSubBot(mode, phoneNumber)

    if (mode === 'qr') {
      const qrData = result.qr.replace('data:image/png;base64,', '')
      const buffer = Buffer.from(qrData, 'base64')

      await sock.sendMessage(chatId, {
        image: buffer,
        caption: `📱 *Escanea este QR Code*

1. Abre WhatsApp en tu teléfono
2. Ve a Dispositivos vinculados
3. Toca "Vincular dispositivo"
4. Escanea este código

⏳ *Tienes 60 segundos*`
      }, { quoted: msg })

    } else {
      await reply(`🔑 *CÓDIGO DE VINCULACIÓN*

*Código:* \`${result.code}\`

1. Abre WhatsApp → Dispositivos vinculados
2. Toca "Vincular con número de teléfono"
3. Ingresa este código

⏳ *Válido por 2 minutos*`, { quoted: msg })
    }

    // Esperar conexión
    result.sock.ev.on('connection.update', async (update) => {
      const { connection } = update

      if (connection === 'open') {
        await reply(`✅ *¡SUB-BOT CONECTADO!*

📱 *Número:* ${result.sock.user.id.split(':')[0]}
👤 *Nombre:* ${result.sock.user.name || 'Unknown'}
🆔 *Sesión:* ${result.sessionId}

💡 Usa *.stopbot* o *.bots* para gestionar`)
      }
    })

  } catch (error) {
    await reply(`❌ *Error:* ${error.message}`)
  }
}

export default { command, description, category, private, run }
