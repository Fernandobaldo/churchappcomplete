import { FastifyRequest } from 'fastify'
import { MultipartFile } from '@fastify/multipart'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = path.join(__dirname, '../../uploads/avatars')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Garantir que o diretório existe
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function uploadAvatar(request: FastifyRequest): Promise<string> {
  await ensureUploadDir()

  const data = await request.file({
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    // Aceita qualquer campo de arquivo
  })

  if (!data) {
    throw new Error('Nenhum arquivo foi enviado')
  }

  // Validar tipo de arquivo
  if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
    throw new Error(
      `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`
    )
  }

  // Gerar nome único para o arquivo
  const fileExtension = path.extname(data.filename || '.jpg')
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`
  const filePath = path.join(UPLOAD_DIR, fileName)

  // Salvar arquivo
  const buffer = await data.toBuffer()
  await fs.writeFile(filePath, buffer)

  // Retornar URL relativa
  return `/uploads/avatars/${fileName}`
}
