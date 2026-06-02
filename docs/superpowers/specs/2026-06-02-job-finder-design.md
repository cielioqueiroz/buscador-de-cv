# Job Finder — Refatoração para Busca Real de Vagas por CV

**Data:** 2026-06-02
**Status:** Aprovado (design) — aguardando plano de implementação

## 1. Objetivo

Refatorar o protótipo `job-finder` (hoje Vite + React + dados mockados) em uma
aplicação de produção que:

1. Recebe o CV do usuário (PDF/DOCX/TXT).
2. Analisa o CV com IA e extrai perfil + queries de busca.
3. Busca **vagas reais** em fontes legais e agregadas.
4. Pontua a compatibilidade CV × vaga com IA, explicando o porquê e as lacunas.
5. Entrega o **link oficial de candidatura** de cada vaga.

Foco geográfico: **Brasil + vagas remotas globais**. Interface em **PT-BR**.
Identidade visual: **moderna e energética** (dark + light).

## 2. Decisões travadas (brainstorming)

| Tema | Decisão |
|---|---|
| Fonte de vagas | Agregadores legais: JSearch (Google for Jobs) + Adzuna BR + Remotive |
| Stack | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Matching | Claude API (score semântico + explicação + lacunas), com prompt caching do CV |
| Login/persistência | Híbrido: funciona sem conta (localStorage); Supabase opcional |
| Escopo v1 | MVP: upload → análise → busca real → score+link → favoritar |

## 3. Por que NÃO usar APIs diretas de LinkedIn/Indeed/Glassdoor/Gupy

- LinkedIn: API só para parceiros aprovados; scraping viola ToS e leva a bloqueio.
- Indeed: Publisher API fechada para novos cadastros.
- Glassdoor: API descontinuada.
- Gupy/Solides: ATS sem busca pública.

**Solução:** JSearch agrega o Google for Jobs, que por sua vez indexa
LinkedIn/Indeed/Glassdoor/Gupy. Assim cobrimos essas fontes de forma **legal e
indireta**, sempre devolvendo o link oficial de candidatura.

## 4. Arquitetura

App único Next.js 15. API Routes rodam no servidor e escondem as chaves; o
navegador nunca acessa chaves de API.

```
job-finder/
├── app/
│   ├── page.tsx                    # Landing + upload do CV
│   ├── resultados/page.tsx         # Vagas com score + filtros
│   ├── perfil/page.tsx             # Perfil extraído do CV
│   └── api/
│       ├── cv/analyze/route.ts     # extrai texto do CV → Claude analisa
│       ├── jobs/search/route.ts    # busca nos provedores → normaliza → dedup
│       └── jobs/match/route.ts     # Claude pontua CV × vaga
├── lib/
│   ├── providers/
│   │   ├── types.ts                # interface JobProvider + tipo Job unificado
│   │   ├── jsearch.ts              # Google for Jobs (LinkedIn/Indeed/Glassdoor)
│   │   ├── adzuna.ts               # vagas Brasil
│   │   ├── remotive.ts             # remoto global
│   │   └── index.ts                # registro + busca agregada
│   ├── cv/parser.ts                # PDF (pdf-parse) + DOCX (mammoth) + TXT
│   ├── ai/claude.ts                # cliente Anthropic + prompt caching
│   ├── matching.ts                 # orquestra score + lacunas
│   └── supabase/                   # cliente + queries (favoritos, histórico)
├── components/                     # shadcn/ui + componentes próprios
├── .env.example
└── README.md
```

### Princípio de isolamento

Cada fonte de vaga é um **adapter independente** que implementa `JobProvider` e
devolve o tipo `Job` unificado. Adicionar fonte nova = criar um arquivo, sem
tocar no resto. Cliente Claude, parser de CV e matching também são módulos
isolados e testáveis.

### Tipos centrais (rascunho)

```ts
interface Job {
  id: string;               // hash estável p/ dedup (titulo+empresa+local)
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  salary?: { min?: number; max?: number; currency: string };
  postedAt?: string;
  source: 'jsearch' | 'adzuna' | 'remotive';
  applyUrl: string;         // link oficial de candidatura
  publisher?: string;       // ex.: "LinkedIn", "Indeed"
}

interface CVProfile {
  title: string;
  seniority: 'estagio' | 'junior' | 'pleno' | 'senior' | 'lead';
  skills: string[];
  areas: string[];
  searchQueries: string[];  // geradas pela IA a partir do CV
  rawText: string;
}

interface MatchResult {
  jobId: string;
  score: number;            // 0–100
  reasons: string[];        // por que combina
  gaps: string[];           // o que falta no CV
}

interface JobProvider {
  name: string;
  search(query: string, opts: SearchOpts): Promise<Job[]>;
}
```

## 5. Fluxo de dados

1. **Upload CV** → `api/cv/analyze`: extrai texto (server-side) → Claude devolve
   `CVProfile` em JSON estruturado, incluindo `searchQueries`.
2. **Busca** → `api/jobs/search`: dispara as queries para todos os providers
   **em paralelo** (`Promise.allSettled`) → normaliza para `Job[]` → deduplica
   por `id` → ordena.
3. **Match** → `api/jobs/match`: Claude compara `CVProfile` × `Job.description`
   para os top N. O `rawText` do CV vai como bloco com `cache_control`
   (prompt caching) para baratear as comparações em lote. Devolve `MatchResult[]`.

## 6. Tratamento de erros

- Provider que falha não derruba a busca (`Promise.allSettled`); UI mostra de
  quais fontes vieram os resultados e quais falharam.
- Falta de chave de API → degrada com aviso claro (ex.: sem RapidAPI, usa só
  Adzuna + Remotive).
- CV ilegível / vazio → mensagem orientando reenvio em outro formato.
- Rate limit → backoff + mensagem; nunca quebra a página.
- Erros nunca expõem chaves no client.

## 7. Persistência (híbrida)

- **Sem login:** `localStorage` guarda o CV analisado e favoritos da sessão.
- **Com login (Supabase):** tabelas `profiles`, `saved_jobs`, `search_history`.
  CV no Storage do Supabase. Sincroniza entre dispositivos.
- Login é opcional e não bloqueia o fluxo principal.

## 8. Testes

- **Providers:** testes unitários com respostas HTTP mockadas → validam
  normalização para `Job` e o dedup.
- **Parser de CV:** fixtures (PDF/DOCX/TXT) → texto esperado.
- **Matching:** mock do cliente Claude → valida shape do `MatchResult` e
  ordenação por score.
- **API Routes:** testes de integração com providers e Claude mockados.
- **E2E (smoke):** upload → busca → ver score → clicar aplicar.

## 9. Variáveis de ambiente (`.env.example`)

```
ANTHROPIC_API_KEY=
RAPIDAPI_KEY=                 # JSearch
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
# Opcionais (login)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Nenhuma chave é commitada. `.claude/` e `.env*` já estão no `.gitignore`.

## 10. Fora do escopo (v2)

- ✍️ Gerar carta de apresentação e adaptar CV por vaga (Claude).
- 📊 Tracker de candidaturas (kanban Aplicado → Entrevista → Oferta).
- 🔔 Alertas por e-mail de vagas novas com bom score (requer cron).
- 🎯 Relatório agregado "como melhorar seu CV".

## 11. Migração do código atual

Reaproveitar do protótipo: `CircularGauge`, `ThemeToggle`, `TrustBadge`,
estrutura visual de `JobCard`/`FilterSidebar`, paleta dark. Substituir:
`mockJobs.js` (→ providers reais), `cvParser.js` (→ `lib/cv` + `lib/ai` com IA),
JS → TS. Roteamento React Router → App Router do Next.
