<div align="center">

# 🎯 Vaga Certa

**Seu currículo vira um radar de vagas.**

Envie seu CV, a IA entende seu perfil e busca **vagas reais** em fontes legais —
com nota de compatibilidade, os motivos do match e o **link oficial de candidatura**.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-API-D97757)
![Tests](https://img.shields.io/badge/tests-16_passing-4d7c0f)
![License](https://img.shields.io/badge/license-MIT-informational)

</div>

---

## ✨ Funcionalidades

- 📄 **Upload de CV** em PDF, DOCX ou TXT (lido no servidor).
- 🧠 **Análise por IA** — o Claude extrai cargo, senioridade, habilidades e gera as melhores buscas.
- 🔎 **Vagas reais e agregadas** de Adzuna (Brasil), Remotive (remoto) e Google for Jobs (via JSearch).
- 🎯 **Score de compatibilidade** por vaga, com os motivos a favor e o que falta no seu CV.
- 🧭 **Filtros** por modalidade remota, fonte e score mínimo.
- 🔗 **Link oficial de candidatura** sempre — sem intermediário.
- 🌗 **Tema claro/escuro** e visual próprio (sem UI kit genérico).
- 🔒 **Sem cadastro** — seus dados ficam no seu navegador (localStorage).

> ⚖️ **Nada de scraping.** Usamos agregadores legais; o Google for Jobs (via JSearch)
> indexa LinkedIn/Indeed/Glassdoor/Gupy e nós sempre levamos ao link oficial da vaga.

## 🚦 Estado do projeto

MVP funcional. A interface roda de imediato, mas **a análise do CV e a busca de vagas
exigem chaves de API** (veja abaixo). Sem elas, o upload retorna um aviso de erro —
é esperado. Login/sincronização via Supabase está previsto para a v2.

## 🧱 Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** — design system próprio (limão elétrico sobre tinta)
- **Claude API** (`@anthropic-ai/sdk`) — análise do CV e matching, com *prompt caching*
- **Vitest** — testes unitários e de integração (APIs externas mockadas)
- `pdf-parse` (v2) · `mammoth` (DOCX) · `zod` · `sonner` · `react-icons`

## 🚀 Começar

```bash
# 1. instalar dependências
npm install

# 2. configurar as chaves
cp .env.example .env.local   # e preencha os valores

# 3. rodar em desenvolvimento
npm run dev                  # http://localhost:3000
```

## 🔑 Variáveis de ambiente

| Variável | Para quê | Onde obter |
|---|---|---|
| `ANTHROPIC_API_KEY` | Análise do CV e matching | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `RAPIDAPI_KEY` | Provider JSearch (Google for Jobs) | [rapidapi.com](https://rapidapi.com) → assine a API "JSearch" |
| `ADZUNA_APP_ID` | Provider Adzuna (vagas Brasil) | [developer.adzuna.com](https://developer.adzuna.com) → registre um app |
| `ADZUNA_APP_KEY` | Provider Adzuna | idem acima |

Opcionais (login futuro): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> As chaves ficam **só no servidor** (API Routes) — nunca vão para o navegador.
> Cada provider degrada com elegância: faltando uma chave, ele retorna vazio e os
> outros continuam funcionando.

## 🧪 Scripts

```bash
npm run dev      # desenvolvimento (http://localhost:3000)
npm run build    # build de produção
npm start        # serve o build
npm test         # testes (Vitest)
npm run lint     # ESLint
```

## 📐 Arquitetura

```text
app/
  page.tsx              landing + upload do CV
  resultados/page.tsx   vagas com score + filtros
  perfil/page.tsx       perfil extraído do CV
  api/
    cv/analyze          extrai texto do CV → Claude devolve o CVProfile
    jobs/search         busca em todos os providers (paralelo) → normaliza → dedup
    jobs/match          Claude pontua CV × vaga (top N), com prompt caching
lib/
  providers/            adapters isolados (adzuna, remotive, jsearch) + agregador
  cv/parser.ts          extração de texto (PDF/DOCX/TXT)
  ai/claude.ts          analyzeCV + matchJob
  matching.ts           rankJobs (orquestra o match em lote)
  store.ts              persistência local (localStorage)
components/             componentes de UI próprios
```

Cada fonte de vaga é um **adapter** que implementa `JobProvider` e devolve o tipo
`Job` unificado — adicionar uma fonte nova é só criar um arquivo, sem tocar no resto.

## 🗺️ Roadmap (v2)

- [ ] Login e sincronização entre dispositivos (Supabase)
- [ ] Gerar carta de apresentação e adaptar o CV por vaga
- [ ] Tracker de candidaturas (kanban: Aplicado → Entrevista → Oferta)
- [ ] Alertas por e-mail de vagas novas com bom score
- [ ] Relatório "como melhorar seu CV"

## 📄 Licença

[MIT](LICENSE)

<div align="center"><sub>Todo talento merece a vaga certa.</sub></div>
