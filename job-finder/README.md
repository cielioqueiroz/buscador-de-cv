# Vaga Certa — encontre vagas pelo seu currículo

Envie seu CV, a IA analisa seu perfil e busca **vagas reais** em fontes legais
(agregadores), pontuando a compatibilidade de cada uma e entregando o **link
oficial de candidatura**. Foco em Brasil + remoto global, interface PT-BR.

> Não fazemos scraping de LinkedIn/Indeed/Glassdoor/Gupy. Usamos agregadores
> legais — incluindo o Google for Jobs (via JSearch), que indexa essas fontes —
> e sempre direcionamos ao link oficial da vaga.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** (design system próprio, sem UI kit genérico)
- **Claude API** (`@anthropic-ai/sdk`) — análise do CV e matching, com prompt caching
- **Vitest** — testes unitários e de integração (APIs externas mockadas)
- Parsers: `pdf-parse` (v2), `mammoth` (DOCX), TXT nativo
- `zod` para validação de tipos · `sonner` para toasts

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o `.env.local` a partir do exemplo e preencha as chaves:
   ```bash
   cp .env.example .env.local
   ```
3. Rode em desenvolvimento:
   ```bash
   npm run dev
   ```
   Abra http://localhost:3000

> Sem as chaves a interface abre normalmente, mas a análise do CV e a busca de
> vagas falham com aviso. As chaves ficam **só no servidor** (API Routes) — nunca
> vão para o navegador.

## Variáveis de ambiente

| Variável | Para quê | Onde obter |
|---|---|---|
| `ANTHROPIC_API_KEY` | Análise do CV e matching | https://console.anthropic.com → API Keys |
| `RAPIDAPI_KEY` | Provider JSearch (Google for Jobs) | https://rapidapi.com → assine a API "JSearch" → copie a chave |
| `ADZUNA_APP_ID` | Provider Adzuna (vagas Brasil) | https://developer.adzuna.com → registre um app |
| `ADZUNA_APP_KEY` | Provider Adzuna | idem acima |

Opcionais (login futuro via Supabase): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> Cada provider degrada com elegância: faltando uma chave, ele só retorna vazio e
> os outros continuam funcionando.

## Scripts

```bash
npm run dev      # desenvolvimento (http://localhost:3000)
npm run build    # build de produção
npm start        # serve o build
npm test         # roda os testes (Vitest)
npm run lint     # ESLint
```

## Arquitetura

```
app/
  page.tsx              landing + upload do CV
  resultados/page.tsx   vagas com score + filtros
  perfil/page.tsx       perfil extraído do CV
  api/
    cv/analyze          extrai texto do CV → Claude devolve CVProfile
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

Cada fonte de vaga é um **adapter** que implementa `JobProvider` e devolve o
tipo `Job` unificado — adicionar uma fonte nova é criar um arquivo.

## Persistência

MVP usa **localStorage** (CV analisado, último ranking e favoritos). Login com
Supabase é incremento futuro (campos já previstos no `.env.example`).

## Licença

MIT
