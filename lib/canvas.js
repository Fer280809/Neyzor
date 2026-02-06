import { createCanvas, loadImage } from '@napi-rs/canvas'
import fs from 'fs'

export async function createWelcomeImage(userName, userNumber, groupName, avatarBuffer, memberCount) {
  try {
    const width = 1024
    const height = 500
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Fondo
    const bgPath = global.config?.welcome?.background
    if (bgPath && fs.existsSync(bgPath)) {
      const bg = await loadImage(bgPath)
      ctx.drawImage(bg, 0, 0, width, height)
    } else {
      // Gradiente default
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(1, '#0f3460')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }

    // Marco
    ctx.strokeStyle = '#00D9FF'
    ctx.lineWidth = 8
    ctx.strokeRect(20, 20, width - 40, height - 40)

    // Avatar
    const avatarX = 200
    const avatarY = 250
    const avatarRadius = 120

    ctx.save()
    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    if (avatarBuffer) {
      const avatar = await loadImage(avatarBuffer)
      ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
    } else {
      ctx.fillStyle = '#333'
      ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
    }
    ctx.restore()

    // Texto "WELCOME"
    ctx.font = 'bold 60px Arial'
    ctx.fillStyle = '#00D9FF'
    ctx.textAlign = 'center'
    ctx.fillText('WELCOME', 650, 150)

    // Nombre de usuario
    ctx.font = 'bold 40px Arial'
    ctx.fillStyle = '#FFFFFF'
    const displayName = userName.length > 20 ? userName.substring(0, 20) + '...' : userName
    ctx.fillText(displayName, 650, 220)

    // Número
    ctx.font = '30px Arial'
    ctx.fillStyle = '#AAAAAA'
    ctx.fillText(`+${userNumber}`, 650, 270)

    // Línea divisoria
    ctx.beginPath()
    ctx.moveTo(450, 300)
    ctx.lineTo(850, 300)
    ctx.strokeStyle = '#00D9FF'
    ctx.lineWidth = 3
    ctx.stroke()

    // Grupo
    ctx.font = '35px Arial'
    ctx.fillStyle = '#FFD700'
    ctx.fillText('To:', 650, 350)

    ctx.font = 'italic 30px Arial'
    ctx.fillStyle = '#FFFFFF'
    const displayGroup = groupName.length > 25 ? groupName.substring(0, 25) + '...' : groupName
    ctx.fillText(displayGroup, 650, 390)

    // Contador
    ctx.font = '25px Arial'
    ctx.fillStyle = '#00FF88'
    ctx.fillText(`Member #${memberCount}`, 650, 440)

    return canvas.toBuffer('image/png')

  } catch (error) {
    console.error('Error canvas:', error)
    throw error
  }
}

export async function createGoodbyeImage(userName, userNumber, groupName, memberCount) {
  const width = 800
  const height = 300
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Fondo oscuro
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#2d1b1b')
  gradient.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Texto
  ctx.font = 'bold 50px Arial'
  ctx.fillStyle = '#FF4444'
  ctx.textAlign = 'center'
  ctx.fillText('GOODBYE', width / 2, 100)

  ctx.font = '35px Arial'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(userName, width / 2, 160)

  ctx.font = '25px Arial'
  ctx.fillStyle = '#AAAAAA'
  ctx.fillText(`Left ${groupName}`, width / 2, 210)
  ctx.fillText(`Remaining: ${memberCount} members`, width / 2, 250)

  return canvas.toBuffer('image/png')
}

export default { createWelcomeImage, createGoodbyeImage }
