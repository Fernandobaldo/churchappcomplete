import QRCode from 'qrcode'
import { createCanvas, loadImage } from 'canvas'

/**
 * Gera um QR code a partir de uma URL e retorna como buffer com texto abaixo
 */
export async function generateQRCode(url: string): Promise<Buffer> {
  try {
    // Gerar QR code como buffer
    const qrCodeBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 1,
    })

    // Carregar QR code como imagem
    const qrCodeImage = await loadImage(qrCodeBuffer)

    // Criar canvas maior para incluir texto
    const canvas = createCanvas(300, 350)
    const ctx = canvas.getContext('2d')

    // Fundo branco
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, 300, 350)

    // Desenhar QR code no topo
    ctx.drawImage(qrCodeImage, 0, 0, 300, 300)

    // Adicionar texto abaixo do QR code
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('Link convite para entrar no app da igreja', 150, 310)

    // Retornar como buffer
    return canvas.toBuffer('image/png')
  } catch (error) {
    throw new Error(`Erro ao gerar QR code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Gera um QR code a partir de uma URL e retorna como data URL (base64)
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    const dataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    })
    return dataURL
  } catch (error) {
    throw new Error(`Erro ao gerar QR code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

