# ⚡ Teste Rápido - 5 Minutos

## 🎯 Início Rápido

### 1. Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Aguarde: `🚀 Server running at http://0.0.0.0:3333`

### 2. Terminal 2 - Frontend
```bash
cd web
npm install  # Apenas na primeira vez
npm run dev
```
✅ Aguarde: `Local: http://localhost:3000`

### 3. Abra o navegador
Acesse: **http://localhost:3000**

## 🔑 Primeiro Login

Se você não tem usuário cadastrado, você pode:

### Opção 1: Criar via API (Postman/Insomnia)
```bash
POST http://localhost:3333/public/register
Content-Type: application/json

{
  "name": "Admin Teste",
  "email": "admin@teste.com",
  "password": "123456"
}
```

### Opção 2: Usar o seed do Prisma
```bash
cd backend
npm run seed
```

### Opção 3: Criar manualmente no banco
Use o Prisma Studio:
```bash
cd backend
npx prisma studio
```

## ✅ Teste Básico (2 minutos)

1. **Login** → Use email e senha
2. **Dashboard** → Veja os cards
3. **Eventos** → Clique em "Novo Evento"
4. **Criar Evento** → Preencha e salve
5. **Ver Evento** → Clique no evento criado

Se tudo funcionar, o front está OK! 🎉

## 🐛 Problema Comum: CORS

Se aparecer erro de CORS, o backend já está configurado com `origin: true`, mas verifique:

1. Backend está rodando? → `http://localhost:3333`
2. Frontend está em `http://localhost:3000`?
3. Verifique o console do navegador (F12)

## 📱 Teste Mobile (Opcional)

Para testar no celular na mesma rede:

1. Descubra seu IP local:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. Acesse no celular: `http://SEU_IP:3000`

3. Ajuste o `.env` do frontend se necessário:
   ```env
   VITE_API_URL=http://SEU_IP:3333
   ```

