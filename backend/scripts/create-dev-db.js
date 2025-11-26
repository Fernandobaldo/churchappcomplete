// scripts/create-dev-db.js
// Script Node.js para criar o banco de dados de desenvolvimento usando Prisma
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega .env
const envPath = join(__dirname, '../.env');
const env = dotenv.config({ path: envPath });

// Usa a DATABASE_URL do .env
const databaseUrl = env.parsed?.DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  console.error(`   Caminho do arquivo: ${envPath}`);
  if (env.error) {
    console.error(`   Erro ao ler arquivo: ${env.error.message}`);
  }
  console.error('');
  console.error('💡 Crie o arquivo backend/.env com:');
  console.error('   DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp?schema=public"');
  console.error('   JWT_SECRET="seu-secret-jwt-aqui"');
  process.exit(1);
}

// Remove aspas se houver
const cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '');

// Extrai informações da URL (usando a URL limpa)
const url = new URL(cleanDatabaseUrl.replace('postgresql://', 'http://'));
const dbName = url.pathname.replace('/', '').split('?')[0];
const dbUser = url.username;
const dbHost = url.hostname;
const dbPort = url.port || 5432;

// URL do banco postgres (para criar o banco de desenvolvimento)
const postgresUrl = cleanDatabaseUrl.replace(`/${dbName}`, '/postgres');

console.log('🗄️  Criando banco de dados para desenvolvimento...');
console.log(`   Host: ${dbHost}`);
console.log(`   Porta: ${dbPort}`);
console.log(`   Usuário: ${dbUser}`);
console.log(`   Banco: ${dbName}`);
console.log('');

// Cria Prisma Client conectando ao banco postgres
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: postgresUrl,
    },
  },
});

// Executa SQL direto para verificar se o banco existe
prisma.$executeRawUnsafe(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`)
  .then(() => {
    console.log(`✅ Banco '${dbName}' já existe`);
    return prisma.$disconnect();
  })
  .then(() => {
    console.log('');
    console.log('✅ Verificação concluída!');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('   1. Aplicar schema: npx prisma migrate deploy');
    console.log('   2. Executar seed: npm run seed');
    console.log('   3. Iniciar servidor: npm run dev');
    process.exit(0);
  })
  .catch(() => {
    // Banco não existe, vamos criar
    return prisma.$executeRawUnsafe(`CREATE DATABASE ${dbName}`)
      .then(() => {
        console.log(`📦 Banco '${dbName}' criado com sucesso!`);
        return prisma.$disconnect();
      })
      .then(() => {
        console.log('');
        console.log('✅ Banco criado com sucesso!');
        console.log('');
        console.log('🚀 Próximos passos:');
        console.log('   1. Aplicar schema: npx prisma migrate deploy');
        console.log('   2. Executar seed: npm run seed');
        console.log('   3. Iniciar servidor: npm run dev');
        process.exit(0);
      })
      .catch((err) => {
        console.error('');
        console.error('❌ Erro:', err.message);
        console.error('');
        console.error('📝 Solução alternativa:');
        console.error(`   Crie manualmente executando no PostgreSQL:`);
        console.error(`   CREATE DATABASE ${dbName};`);
        console.error('');
        console.error('Ou use o psql:');
        console.error(`   psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -c "CREATE DATABASE ${dbName};"`);
        prisma.$disconnect();
        process.exit(1);
      });
  });

