# Documentação de APIs, Funções e Componentes (ChurchPulse)

Esta pasta consolida a documentação “pública” do repositório: **API HTTP do backend**, **clientes de API** consumidos por `web`/`mobile`/`web-admin`, e **componentes reutilizáveis**.

## Índice

- **Backend (HTTP API)**
  - `docs/backend-api.md`: catálogo de endpoints, autenticação, exemplos de uso
  - `docs/backend-funcoes-e-middlewares.md`: middlewares e helpers internos (API de desenvolvimento)
- **Web (Vite/React)**
  - `docs/web-api.md`: `axios` client, stores e utilitários “públicos”
  - `docs/web-components.md`: componentes em `web/src/components`
- **Mobile (Expo/React Native)**
  - `docs/mobile-api.md`: `axios` client, store e módulos de API
  - `docs/mobile-components.md`: componentes em `mobile/src/components`
  - `docs/mobile-layouts.md`: layouts padronizados (ViewScreenLayout, DetailScreenLayout, FormScreenLayout)
- **Web Admin (Vite/React)**
  - `docs/web-admin.md`: API admin, store, utilitários e componentes principais

## Fonte da verdade (contratos)

- **Swagger/OpenAPI do backend**: exposto em `GET /docs` quando o `backend` está rodando (porta padrão `3333`).
  - A documentação desta pasta aponta os endpoints e explica o uso; o Swagger contém os schemas mais completos (request/response) em tempo real.

## Como rodar localmente (referência rápida)

- **Backend**
  - Porta padrão: `http://localhost:3333`
  - Swagger UI: `http://localhost:3333/docs`

- **Web / Web-Admin**
  - `VITE_API_URL` define a base URL do backend (fallback: `http://localhost:3333`)

- **Mobile**
  - `EXPO_PUBLIC_API_URL` (ou `app.config.js extra.apiUrl`) define a base URL do backend.

