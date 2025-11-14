#!/bin/bash

# Script para criar o banco de dados de teste

echo "🗄️  Criando banco de dados para testes..."

# Carrega variáveis do .env.test
if [ -f .env.test ]; then
    source .env.test
    export DATABASE_URL
else
    echo "❌ Arquivo .env.test não encontrado!"
    exit 1
fi

# Extrai informações da DATABASE_URL
# Formato: postgresql://usuario:senha@host:porta/banco
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# URL do banco postgres (para criar o banco de teste)
POSTGRES_URL=$(echo $DATABASE_URL | sed "s|/$DB_NAME|/postgres|")

echo "📋 Informações:"
echo "   Host: $DB_HOST"
echo "   Porta: $DB_PORT"
echo "   Usuário: $DB_USER"
echo "   Banco: $DB_NAME"

# Tenta criar o banco usando Prisma
echo ""
echo "🔧 Tentando criar o banco usando Prisma..."

# Cria o banco usando Prisma Studio ou migrate
npx prisma db execute --stdin <<EOF 2>/dev/null || true
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOF

# Alternativa: usar node para criar o banco
echo "🔧 Tentando criar o banco usando Node.js..."

node <<EOF
const { Client } = require('pg');

const postgresUrl = '${POSTGRES_URL}';
const dbName = '${DB_NAME}';

const client = new Client({
  connectionString: postgresUrl
});

client.connect()
  .then(() => {
    console.log('✅ Conectado ao PostgreSQL');
    return client.query(\`SELECT 1 FROM pg_database WHERE datname = '\${dbName}'\`);
  })
  .then((result) => {
    if (result.rows.length === 0) {
      console.log(\`📦 Criando banco '\${dbName}'...\`);
      return client.query(\`CREATE DATABASE \${dbName}\`);
    } else {
      console.log(\`✅ Banco '\${dbName}' já existe\`);
      return Promise.resolve();
    }
  })
  .then(() => {
    console.log('✅ Banco criado com sucesso!');
    client.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro:', err.message);
    client.end();
    process.exit(1);
  });
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Banco de dados criado com sucesso!"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Aplicar migrations: npx prisma migrate deploy"
    echo "   2. Executar testes: npm test"
else
    echo ""
    echo "⚠️  Não foi possível criar o banco automaticamente."
    echo ""
    echo "📝 Crie manualmente executando no PostgreSQL:"
    echo "   CREATE DATABASE ${DB_NAME};"
    echo ""
    echo "Ou use o psql:"
    echo "   psql -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -c \"CREATE DATABASE ${DB_NAME};\""
fi

