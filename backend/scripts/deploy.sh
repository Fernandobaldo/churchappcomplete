#!/bin/bash

set -e

echo "🚀 Iniciando deploy do backend..."

# Verificar variáveis de ambiente
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não configurada"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET não configurada"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Executar migrações
echo "🗄️ Executando migrações..."
npx prisma migrate deploy

# Build
echo "🔨 Fazendo build..."
npm run build

# Iniciar servidor
echo "✅ Deploy concluído!"
npm start





