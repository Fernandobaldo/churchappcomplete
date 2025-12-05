// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'

// Carrega .env.test se estiver em ambiente de teste
// IMPORTANTE: Deve ser carregado ANTES de criar o PrismaClient
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  dotenv.config({ path: '.env.test' })
} else {
  dotenv.config()
}

// Limpa a DATABASE_URL se tiver aspas (para testes)
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    const cleanUrl = dbUrl.replace(/^["']|["']$/g, '') // Remove aspas
    // Atualiza a DATABASE_URL sem aspas
    process.env.DATABASE_URL = cleanUrl
  }
}

// Singleton pattern para garantir uma única instância do Prisma Client
// Isso é especialmente importante em testes onde múltiplos módulos podem importar o prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria o Prisma Client com a DATABASE_URL limpa (sem aspas)
const databaseUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '') || process.env.DATABASE_URL

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? {
      db: {
        url: databaseUrl
      }
    } : undefined,
    log: process.env.NODE_ENV === 'test' || process.env.VITEST ? ['error', 'warn'] : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
