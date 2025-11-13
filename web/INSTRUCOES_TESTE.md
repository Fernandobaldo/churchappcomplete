# 🧪 Como Testar o Front-End Web

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **Backend rodando** na porta 3333
3. **Banco de dados PostgreSQL** configurado e rodando

## 🚀 Passo a Passo

### 1. Instalar Dependências

```bash
cd web
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `web/`:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

Adicione o conteúdo:

```env
VITE_API_URL=http://localhost:3333
```

**Importante:** Se o backend estiver rodando em outro IP/porta, ajuste a URL acima.

### 3. Iniciar o Backend

Certifique-se de que o backend está rodando:

```bash
cd backend
npm run dev
```

O backend deve estar acessível em `http://localhost:3333`

### 4. Iniciar o Front-End

Em um novo terminal:

```bash
cd web
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

## 🔐 Testando o Login

1. Acesse `http://localhost:3000`
2. Você será redirecionado para `/login`
3. Use as credenciais de um usuário existente no banco de dados

**Dica:** Se não tiver usuários, você pode:
- Criar um usuário através do endpoint `/public/register` (se disponível)
- Ou criar diretamente no banco de dados
- Ou usar o seed do Prisma se houver

## ✅ Checklist de Testes

### Autenticação
- [ ] Login com credenciais válidas
- [ ] Redirecionamento após login
- [ ] Logout funciona
- [ ] Rotas protegidas redirecionam para login se não autenticado

### Dashboard
- [ ] Cards de acesso rápido aparecem
- [ ] Próximo evento é exibido (se houver)
- [ ] Ações rápidas funcionam

### Eventos
- [ ] Listar eventos
- [ ] Criar novo evento
- [ ] Visualizar detalhes do evento
- [ ] Editar evento
- [ ] Excluir evento (se tiver permissão)

### Contribuições
- [ ] Listar contribuições
- [ ] Ver estatísticas (total, ofertas, dízimos)
- [ ] Criar nova contribuição
- [ ] Visualizar detalhes

### Devocionais
- [ ] Listar devocionais
- [ ] Criar novo devocional
- [ ] Visualizar detalhes
- [ ] Curtir devocional (se autenticado)

### Membros
- [ ] Listar membros
- [ ] Criar novo membro
- [ ] Visualizar detalhes do membro

### Permissões
- [ ] Listar membros
- [ ] Selecionar membro
- [ ] Adicionar permissão
- [ ] Remover permissão

### Perfil
- [ ] Visualizar dados do perfil
- [ ] Editar informações
- [ ] Salvar alterações

## 🐛 Resolução de Problemas

### Erro: "Cannot connect to API"

**Solução:**
1. Verifique se o backend está rodando: `http://localhost:3333`
2. Verifique o arquivo `.env` - a URL está correta?
3. Verifique o CORS no backend (deve permitir `http://localhost:3000`)

### Erro: "401 Unauthorized"

**Solução:**
1. Faça logout e login novamente
2. Verifique se o token está sendo salvo no localStorage
3. Verifique se o backend está gerando tokens corretamente

### Erro: "Module not found"

**Solução:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 já está em uso

**Solução:**
1. Pare o processo que está usando a porta 3000
2. Ou altere a porta no `vite.config.ts`:
```typescript
server: {
  port: 3001, // ou outra porta
  // ...
}
```

## 🔍 Ferramentas Úteis para Debug

### DevTools do Navegador
- **Console:** Ver erros JavaScript
- **Network:** Ver requisições HTTP
- **Application > Local Storage:** Ver token salvo

### React DevTools
Instale a extensão do React DevTools no navegador para inspecionar componentes.

## 📝 Dados de Teste

Para facilitar os testes, você pode criar dados de exemplo:

1. **Criar um evento:**
   - Título: "Culto de Domingo"
   - Data: Data futura
   - Local: "Templo Principal"

2. **Criar uma contribuição:**
   - Título: "Oferta de Domingo"
   - Valor: 100.00
   - Tipo: Oferta

3. **Criar um devocional:**
   - Título: "A importância da oração"
   - Passagem: "Mateus 6:9-13"
   - Conteúdo: Texto do devocional

## 🎯 Próximos Passos

Após testar todas as funcionalidades:
1. Verifique se há algum erro no console
2. Teste em diferentes navegadores (Chrome, Firefox, Edge)
3. Teste responsividade (mobile, tablet, desktop)
4. Verifique acessibilidade básica

