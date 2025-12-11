import { rmSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const nodeModulesPath = join(__dirname, '..', 'node_modules')
const prismaCachePath = join(nodeModulesPath, '.prisma')
const prismaClientPath = join(nodeModulesPath, '@prisma', 'client')

try {
  console.log('🧹 Limpando cache do Prisma...')
  
  if (prismaCachePath) {
    try {
      rmSync(prismaCachePath, { recursive: true, force: true })
      console.log('✅ Cache do Prisma removido')
    } catch (err) {
      // Ignora se não existir
    }
  }
  
  if (prismaClientPath) {
    try {
      rmSync(prismaClientPath, { recursive: true, force: true })
      console.log('✅ Prisma Client removido')
    } catch (err) {
      // Ignora se não existir
    }
  }
  
  console.log('✅ Limpeza concluída')
} catch (error) {
  console.warn('⚠️ Aviso durante limpeza (pode ser ignorado):', error.message)
  // Não falha o build se houver erro
  process.exit(0)
}


