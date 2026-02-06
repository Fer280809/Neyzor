import axios from 'axios'
import { delay } from './helpers.js'

/**
 * Descarga la foto de perfil de un usuario
 */
export async function downloadProfilePicture(sock, jid) {
  try {
    // Intentar obtener URL de la foto
    const url = await sock.profilePictureUrl(jid, 'image')
    if (!url) return null

    // Descargar
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    return Buffer.from(response.data)
  } catch {
    return null
  }
}

/**
 * Formatea números
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Trunca texto
 */
export function truncate(text, length = 100) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Parsea menciones
 */
export function parseMentions(text) {
  const matches = text.match(/@\d{5,20}/g) || []
  return matches.map(m => m.slice(1) + '@s.whatsapp.net')
}

export default {
  downloadProfilePicture,
  formatNumber,
  truncate,
  parseMentions
}
