import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { prisma } from './lib/prisma.js';
import { registerRoutes } from './routes/registerRoutes';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { env } from './env.js';
import { authenticate } from './middlewares/authenticate.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Se dotenv-cli carregou .env.test, detecta pelo DATABASE_URL
// Carrega .env primeiro
dotenv.config();

// Se DATABASE_URL aponta para banco de teste, assume modo E2E
const isTestDb = process.env.DATABASE_URL?.includes('churchapp_test') || process.env.DATABASE_URL?.includes('_test');
if (isTestDb) {
  console.log('[SERVER] 🧪 Detectado banco de teste - modo E2E ativado');
}

// Se DATABASE_URL não estiver definida, tenta carregar .env.test
if (!process.env.DATABASE_URL) {
  console.log('[SERVER] DATABASE_URL não encontrada no .env, tentando .env.test...');
  dotenv.config({ path: '.env.test' });
  
  if (process.env.DATABASE_URL) {
    console.log('[SERVER] ✅ DATABASE_URL carregada do .env.test');
  } else {
    console.warn('[SERVER] ⚠️ DATABASE_URL não encontrada em .env nem .env.test');
    console.warn('[SERVER] ⚠️ Configure a DATABASE_URL em um dos arquivos para o servidor funcionar');
  }
}

// Valida se está usando banco de teste
if (isTestDb && process.env.DATABASE_URL) {
  console.log('[SERVER] ✅ Modo E2E: Usando banco de teste');
} else if (process.env.DATABASE_URL && !isTestDb) {
  console.log('[SERVER] ℹ️ Usando banco de desenvolvimento/produção');
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({ logger: true });

app.register(fastifyCors, { origin: true });

app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
});

// Servir arquivos estáticos da pasta uploads
app.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
});

// Usa o middleware authenticate que popula request.user corretamente
app.decorate('authenticate', authenticate);

app.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'ChurchPulse API',
            description: `
# ChurchPulse API - Documentação Completa

Sistema white-label para gestão de igrejas com controle de acesso baseado em roles e permissões granulares.

## Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos, inclua o token no header:

\`\`\`
Authorization: Bearer <seu-token>
\`\`\`

## Hierarquia de Roles

- **ADMINGERAL**: Administrador geral da igreja (acesso total)
- **ADMINFILIAL**: Administrador de filial (gerencia apenas sua filial)
- **COORDINATOR**: Coordenador (acesso baseado em permissões)
- **MEMBER**: Membro comum (acesso limitado)

## Permissões Granulares

- \`devotional_manage\`: Gerenciar devocionais
- \`members_view\`: Visualizar membros
- \`members_manage\`: Criar/editar membros
- \`events_manage\`: Gerenciar eventos
- \`contributions_manage\`: Gerenciar contribuições
- \`finances_manage\`: Gerenciar finanças

## Validações de Segurança

- ✅ Validação de limites de plano (maxMembers, maxBranches)
- ✅ Validação de autorização por role
- ✅ Validação de hierarquia (quem pode criar quem)
- ✅ Validação de branch/igreja (isolamento de dados)
- ✅ Filtros automáticos por filial/igreja

## Códigos de Status HTTP

- \`200\`: Sucesso
- \`201\`: Criado com sucesso
- \`400\`: Erro de validação
- \`401\`: Não autenticado
- \`403\`: Sem permissão / Limite excedido
- \`404\`: Recurso não encontrado
- \`500\`: Erro interno do servidor
            `,
            version: '1.0.0',
            contact: {
                name: 'ChurchPulse Support',
                email: 'support@churchpulse.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3333',
                description: 'Servidor de desenvolvimento',
            },
            {
                url: 'http://192.168.1.13:3333',
                description: 'Servidor local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtido através do endpoint /auth/login',
                },
            },
        },
        tags: [
            {
                name: 'Autenticação',
                description: 'Endpoints de autenticação e autorização',
            },
            {
                name: 'Membros',
                description: 'Gerenciamento de membros da igreja',
            },
            {
                name: 'Filiais',
                description: 'Gerenciamento de filiais (branches)',
            },
            {
                name: 'Igrejas',
                description: 'Gerenciamento de igrejas',
            },
            {
                name: 'Eventos',
                description: 'Gerenciamento de eventos',
            },
            {
                name: 'Devocionais',
                description: 'Gerenciamento de devocionais',
            },
            {
                name: 'Contribuições',
                description: 'Gerenciamento de contribuições',
            },
            {
                name: 'Planos',
                description: 'Gerenciamento de planos e assinaturas',
            },
            {
                name: 'Permissões',
                description: 'Gerenciamento de permissões granulares',
            },
            {
                name: 'Admin',
                description: 'Endpoints administrativos do SaaS',
            },
            {
                name: 'Auditoria',
                description: 'Logs de auditoria de ações administrativas',
            },
            {
                name: 'Links de Convite',
                description: 'Gerenciamento de links de convite para registro de membros',
            },
        ],
    },
});

app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    exposeRoute: true,
});

await registerRoutes(app);

app.listen({ port: 3333, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log(`🚀 Server running at ${address}`);
});
