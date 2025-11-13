#!/bin/bash

# Script de teste rápido para o front-end

echo "🚀 Iniciando teste do Front-End ChurchPulse"
echo ""

# Verifica se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na pasta 'web'"
    exit 1
fi

# Verifica se o .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    echo "VITE_API_URL=http://localhost:3333" > .env
    echo "✅ Arquivo .env criado!"
fi

# Verifica se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo "✅ Dependências instaladas!"
fi

# Verifica se o backend está rodando
echo "🔍 Verificando se o backend está rodando..."
if curl -s http://localhost:3333 > /dev/null 2>&1; then
    echo "✅ Backend está rodando!"
else
    echo "⚠️  Backend não está respondendo em http://localhost:3333"
    echo "   Certifique-se de iniciar o backend primeiro:"
    echo "   cd ../backend && npm run dev"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎯 Iniciando servidor de desenvolvimento..."
echo "   Acesse: http://localhost:3000"
echo ""

npm run dev

