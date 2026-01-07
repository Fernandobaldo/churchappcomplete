# E2E (end-to-end) — ChurchPulse Mobile

Este diretório é o **ponto oficial** para a suíte de testes E2E do app mobile.

## Objetivo

Validar fluxos críticos “de ponta a ponta” em um app real (build instalado), com navegação, permissões e efeitos colaterais acontecendo como em produção.

## Princípios

- **Poucos e valiosos**: E2E é caro. Foque em fluxos essenciais e caminhos de erro relevantes.
- **Seletores estáveis**: prefira `testID` e/ou rótulos acessíveis consistentes para localizar elementos.
- **Ambiente previsível**: rode contra um backend de QA/staging ou uma API mockada/isolada, com dados controláveis.

## Estrutura recomendada

Crie uma subpasta por runner:

```
mobile/e2e/
├── detox/            # specs e config do Detox
└── maestro/          # flows .yaml do Maestro (opcional)
```

## Runner recomendado: Detox

**Quando usar**: E2E robusto (Android/iOS), asserts fortes e boa integração com CI.

### Pré-requisitos (alto nível)

- Definir a estratégia de build para testes:
  - **Expo Dev Client** (recomendado para projetos Expo), ou
  - workflow que permita build “testável” para o Detox.
- Padronizar `testID` nos elementos críticos (inputs, botões, listas e itens de lista).
- Definir variável de ambiente “E2E” (ex.: `APP_ENV=e2e`) para:
  - apontar `apiUrl` para ambiente de testes
  - desligar analytics/telemetria se necessário

### Suite mínima sugerida (smoke)

- **Auth**: login válido → dashboard
- **Eventos**: criar evento → ver na lista → abrir detalhes
- **Membros**: cadastrar membro → confirmar sucesso

## Alternativa: Maestro

**Quando usar**: smoke tests rápidos e fáceis de manter, com fluxos declarativos.

### Suite mínima sugerida

- “Abrir app → login → navegar para tela X → validar texto”

## Checklist antes de abrir PR com E2E

- [ ] Os fluxos não dependem de dados “do mundo real” (dados flutuando no ambiente)
- [ ] Existe plano para reset/seed de dados (ou usuário fixo de QA)
- [ ] Seletores estáveis (`testID`/acessibilidade) sem dependência de textos frágeis
- [ ] Tempo/esperas são baseados em condição (não em `sleep` cego)

