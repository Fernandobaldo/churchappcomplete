#!/bin/bash

set -e

echo "🚀 Iniciando deploy do web..."

# Verificar variáveis de ambiente
if [ -z "$VITE_API_URL" ]; then
  echo "❌ VITE_API_URL não configurada"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build
echo "🔨 Fazendo build..."
npm run build

echo "✅ Build concluído! Arquivos em ./dist"







