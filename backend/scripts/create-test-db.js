// Script Node.js para criar o banco de dados de teste usando Prisma
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega .env.test
const envTestPath = join(__dirname, '../.env.test');
const envTest = dotenv.config({ path: envTestPath });

// Usa a DATABASE_URL do .env.test (prioridade)
const databaseUrl = envTest.parsed?.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada no .env.test');
  console.error(`   Caminho do arquivo: ${envTestPath}`);
  if (envTest.error) {
    console.error(`   Erro ao ler arquivo: ${envTest.error.message}`);
  }
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

// URL do banco postgres (para criar o banco de teste)
const postgresUrl = cleanDatabaseUrl.replace(`/${dbName}`, '/postgres');

console.log('🗄️  Criando banco de dados para testes...');
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

// Executa SQL direto para criar o banco
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
    console.log('   1. Aplicar migrations: npm run setup-test-db');
    console.log('   2. Executar testes: npm test');
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
        console.log('   1. Aplicar migrations: npm run setup-test-db');
        console.log('   2. Executar testes: npm test');
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

