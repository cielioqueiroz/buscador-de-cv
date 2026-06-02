# Job Finder MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o protótipo `job-finder` em um app Next.js 15 que analisa um CV com IA, busca vagas reais em agregadores legais e pontua a compatibilidade com link oficial de candidatura.

**Architecture:** App único Next.js 15 (App Router). API Routes no servidor escondem as chaves. Cada fonte de vaga é um adapter isolado que implementa `JobProvider` e devolve o tipo `Job`. Claude API faz análise do CV e matching (com prompt caching). Persistência híbrida: localStorage por padrão, Supabase opcional.

**Tech Stack:** Next.js 15, TypeScript, Tailwind + shadcn/ui, Vitest, @anthropic-ai/sdk, pdf-parse, mammoth, Zod, Supabase (opcional).

**Ambiente:** Windows + PowerShell, npm. Diretório de trabalho do app: `D:\Projetos_Programacao\claudecode\job-finder`.

**Pré-requisito de chaves (`.env.local`):** `ANTHROPIC_API_KEY`, `RAPIDAPI_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`. Os testes NÃO chamam APIs reais — tudo é mockado.

---

## File Structure

```
job-finder/
├── app/
│   ├── layout.tsx                  # raiz, ThemeProvider, fontes
│   ├── page.tsx                    # landing + upload do CV
│   ├── resultados/page.tsx         # lista de vagas com score
│   ├── perfil/page.tsx             # perfil extraído do CV
│   └── api/
│       ├── cv/analyze/route.ts
│       ├── jobs/search/route.ts
│       └── jobs/match/route.ts
├── lib/
│   ├── providers/
│   │   ├── types.ts                # Job, JobProvider, SearchOpts, CVProfile, MatchResult
│   │   ├── adzuna.ts
│   │   ├── remotive.ts
│   │   ├── jsearch.ts
│   │   └── index.ts                # registro + searchAllProviders + dedup
│   ├── cv/parser.ts                # extractText(file) -> string
│   ├── ai/claude.ts                # analyzeCV, matchJob
│   ├── matching.ts                 # rankJobs (orquestra match em lote)
│   └── supabase/client.ts          # opcional
├── components/                     # shadcn/ui + próprios
├── lib/__tests__/                  # testes Vitest
├── .env.example
├── vitest.config.ts
└── README.md
```

---

## Task 0: Scaffold do projeto Next.js + Vitest

**Files:**
- Modify: substitui todo o conteúdo de `job-finder/` (preserva `README.md` antigo como referência → renomeia para `README.legacy.md`)
- Create: `job-finder/vitest.config.ts`, `job-finder/.env.example`

- [ ] **Step 1: Backup do protótipo e limpeza**

Run (PowerShell, na raiz `D:\Projetos_Programacao\claudecode`):
```powershell
Rename-Item job-finder job-finder-legacy
```
Mantemos o legacy ao lado para copiar componentes visuais depois (Task 9). Será removido no final.

- [ ] **Step 2: Criar app Next.js 15 + TypeScript + Tailwind**

Run:
```powershell
npx create-next-app@latest job-finder --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```
Expected: cria `job-finder/` com App Router, TS e Tailwind configurados.

- [ ] **Step 3: Instalar dependências de runtime e teste**

Run (na pasta `job-finder`):
```powershell
npm install @anthropic-ai/sdk zod mammoth pdf-parse
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Configurar Vitest**

Create `job-finder/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

Adicionar script em `package.json` (campo `scripts`):
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Criar `.env.example`**

Create `job-finder/.env.example`:
```
ANTHROPIC_API_KEY=
RAPIDAPI_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
# Opcionais (login)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 6: Verificar build e teste vazio**

Run:
```powershell
npm run build
npx vitest run --passWithNoTests
```
Expected: build OK; vitest sem testes passa.

- [ ] **Step 7: Commit**

```powershell
git add job-finder vitest.config.ts; git commit -m "chore: scaffold Next.js 15 + TS + Vitest para job-finder"
```

---

## Task 1: Tipos centrais e interface de provider

**Files:**
- Create: `job-finder/lib/providers/types.ts`
- Test: `job-finder/lib/__tests__/types.test.ts`

- [ ] **Step 1: Escrever teste que valida o schema Zod do Job**

Create `job-finder/lib/__tests__/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { JobSchema } from '@/lib/providers/types';

describe('JobSchema', () => {
  it('aceita uma vaga válida', () => {
    const job = {
      id: 'abc', title: 'Dev', company: 'ACME', location: 'Remoto',
      remote: true, description: 'desc', source: 'adzuna',
      applyUrl: 'https://x.com/apply',
    };
    expect(() => JobSchema.parse(job)).not.toThrow();
  });

  it('rejeita vaga sem applyUrl', () => {
    const bad = { id: 'a', title: 'Dev', company: 'ACME', location: 'X', remote: false, description: 'd', source: 'adzuna' };
    expect(() => JobSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Rodar teste e ver falhar**

Run: `npx vitest run lib/__tests__/types.test.ts`
Expected: FAIL — módulo `types` não existe.

- [ ] **Step 3: Implementar os tipos**

Create `job-finder/lib/providers/types.ts`:
```ts
import { z } from 'zod';

export const SeniorityEnum = z.enum(['estagio', 'junior', 'pleno', 'senior', 'lead']);
export type Seniority = z.infer<typeof SeniorityEnum>;

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote: z.boolean(),
  description: z.string(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string(),
  }).optional(),
  postedAt: z.string().optional(),
  source: z.enum(['jsearch', 'adzuna', 'remotive']),
  applyUrl: z.string().url(),
  publisher: z.string().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const CVProfileSchema = z.object({
  title: z.string(),
  seniority: SeniorityEnum,
  skills: z.array(z.string()),
  areas: z.array(z.string()),
  searchQueries: z.array(z.string()),
  rawText: z.string(),
});
export type CVProfile = z.infer<typeof CVProfileSchema>;

export const MatchResultSchema = z.object({
  jobId: z.string(),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  gaps: z.array(z.string()),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

export interface SearchOpts {
  location?: string;
  remoteOnly?: boolean;
  page?: number;
}

export interface JobProvider {
  name: 'jsearch' | 'adzuna' | 'remotive';
  search(query: string, opts: SearchOpts): Promise<Job[]>;
}

/** Gera um id estável p/ dedup. */
export function jobId(title: string, company: string, location: string): string {
  return Buffer.from(`${title}|${company}|${location}`.toLowerCase()).toString('base64url');
}
```

- [ ] **Step 4: Rodar teste e ver passar**

Run: `npx vitest run lib/__tests__/types.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```powershell
git add lib/providers/types.ts lib/__tests__/types.test.ts; git commit -m "feat: tipos centrais Job/CVProfile/MatchResult + JobProvider"
```

---

## Task 2: Provider Adzuna

**Files:**
- Create: `job-finder/lib/providers/adzuna.ts`
- Test: `job-finder/lib/__tests__/adzuna.test.ts`

- [ ] **Step 1: Escrever teste com resposta HTTP mockada**

Create `job-finder/lib/__tests__/adzuna.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adzuna } from '@/lib/providers/adzuna';

const fakeResponse = {
  results: [{
    id: '123', title: 'Desenvolvedor React',
    company: { display_name: 'ACME' },
    location: { display_name: 'São Paulo' },
    description: 'Vaga de React e TypeScript',
    redirect_url: 'https://adzuna.com/apply/123',
    salary_min: 5000, salary_max: 9000,
    created: '2026-06-01T00:00:00Z',
  }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true, json: async () => fakeResponse,
  })));
  process.env.ADZUNA_APP_ID = 'id';
  process.env.ADZUNA_APP_KEY = 'key';
});

describe('adzuna.search', () => {
  it('normaliza a resposta para Job[]', async () => {
    const jobs = await adzuna.search('react', { location: 'São Paulo' });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Desenvolvedor React', company: 'ACME',
      source: 'adzuna', applyUrl: 'https://adzuna.com/apply/123',
    });
    expect(jobs[0].salary).toEqual({ min: 5000, max: 9000, currency: 'BRL' });
  });

  it('retorna [] quando a API falha', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    const jobs = await adzuna.search('react', {});
    expect(jobs).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/adzuna.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o provider**

Create `job-finder/lib/providers/adzuna.ts`:
```ts
import { Job, JobProvider, SearchOpts, jobId } from './types';

const BASE = 'https://api.adzuna.com/v1/api/jobs/br/search/1';

export const adzuna: JobProvider = {
  name: 'adzuna',
  async search(query: string, opts: SearchOpts): Promise<Job[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];

    const params = new URLSearchParams({
      app_id: appId, app_key: appKey,
      what: query, results_per_page: '20',
      'content-type': 'application/json',
    });
    if (opts.location) params.set('where', opts.location);

    try {
      const res = await fetch(`${BASE}?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results ?? []).map((r: any): Job => {
        const company = r.company?.display_name ?? 'Empresa não informada';
        const location = r.location?.display_name ?? 'Brasil';
        const title = r.title ?? 'Vaga';
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: /remoto|remote|home office/i.test(`${title} ${r.description ?? ''} ${location}`),
          description: r.description ?? '',
          salary: (r.salary_min || r.salary_max)
            ? { min: r.salary_min, max: r.salary_max, currency: 'BRL' }
            : undefined,
          postedAt: r.created,
          source: 'adzuna',
          applyUrl: r.redirect_url,
        };
      });
    } catch {
      return [];
    }
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/adzuna.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```powershell
git add lib/providers/adzuna.ts lib/__tests__/adzuna.test.ts; git commit -m "feat: provider Adzuna (vagas Brasil)"
```

---

## Task 3: Provider Remotive

**Files:**
- Create: `job-finder/lib/providers/remotive.ts`
- Test: `job-finder/lib/__tests__/remotive.test.ts`

- [ ] **Step 1: Escrever teste com resposta mockada**

Create `job-finder/lib/__tests__/remotive.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remotive } from '@/lib/providers/remotive';

const fake = {
  jobs: [{
    id: 99, title: 'Senior Frontend Engineer',
    company_name: 'Globex', candidate_required_location: 'Worldwide',
    description: '<p>React role</p>', url: 'https://remotive.com/job/99',
    publication_date: '2026-05-30',
  }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fake })));
});

describe('remotive.search', () => {
  it('normaliza e marca remote=true', async () => {
    const jobs = await remotive.search('frontend', {});
    expect(jobs[0]).toMatchObject({
      title: 'Senior Frontend Engineer', company: 'Globex',
      remote: true, source: 'remotive', applyUrl: 'https://remotive.com/job/99',
    });
    expect(jobs[0].description).not.toContain('<p>');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/remotive.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `job-finder/lib/providers/remotive.ts`:
```ts
import { Job, JobProvider, SearchOpts, jobId } from './types';

const BASE = 'https://remotive.com/api/remote-jobs';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const remotive: JobProvider = {
  name: 'remotive',
  async search(query: string, _opts: SearchOpts): Promise<Job[]> {
    try {
      const params = new URLSearchParams({ search: query, limit: '20' });
      const res = await fetch(`${BASE}?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.jobs ?? []).map((j: any): Job => {
        const company = j.company_name ?? 'Empresa';
        const location = j.candidate_required_location || 'Remoto';
        const title = j.title ?? 'Vaga';
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: true,
          description: stripHtml(j.description ?? ''),
          postedAt: j.publication_date,
          source: 'remotive',
          applyUrl: j.url,
        };
      });
    } catch {
      return [];
    }
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/remotive.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/providers/remotive.ts lib/__tests__/remotive.test.ts; git commit -m "feat: provider Remotive (vagas remotas globais)"
```

---

## Task 4: Provider JSearch (Google for Jobs via RapidAPI)

**Files:**
- Create: `job-finder/lib/providers/jsearch.ts`
- Test: `job-finder/lib/__tests__/jsearch.test.ts`

- [ ] **Step 1: Escrever teste com resposta mockada**

Create `job-finder/lib/__tests__/jsearch.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsearch } from '@/lib/providers/jsearch';

const fake = {
  data: [{
    job_id: 'xyz', job_title: 'Backend Developer',
    employer_name: 'Initech', job_city: 'Remote', job_country: 'BR',
    job_description: 'Node.js backend', job_apply_link: 'https://linkedin.com/jobs/xyz',
    job_is_remote: true, job_publisher: 'LinkedIn',
    job_posted_at_datetime_utc: '2026-05-29T00:00:00Z',
  }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fake })));
  process.env.RAPIDAPI_KEY = 'k';
});

describe('jsearch.search', () => {
  it('normaliza e preserva publisher', async () => {
    const jobs = await jsearch.search('backend', {});
    expect(jobs[0]).toMatchObject({
      title: 'Backend Developer', company: 'Initech',
      remote: true, source: 'jsearch',
      applyUrl: 'https://linkedin.com/jobs/xyz', publisher: 'LinkedIn',
    });
  });

  it('retorna [] sem RAPIDAPI_KEY', async () => {
    delete process.env.RAPIDAPI_KEY;
    const jobs = await jsearch.search('x', {});
    expect(jobs).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/jsearch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `job-finder/lib/providers/jsearch.ts`:
```ts
import { Job, JobProvider, SearchOpts, jobId } from './types';

const HOST = 'jsearch.p.rapidapi.com';

export const jsearch: JobProvider = {
  name: 'jsearch',
  async search(query: string, opts: SearchOpts): Promise<Job[]> {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return [];

    const q = opts.location ? `${query} in ${opts.location}` : query;
    const params = new URLSearchParams({ query: q, page: String(opts.page ?? 1), num_pages: '1' });
    if (opts.remoteOnly) params.set('remote_jobs_only', 'true');

    try {
      const res = await fetch(`https://${HOST}/search?${params.toString()}`, {
        headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': HOST },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data ?? []).map((j: any): Job => {
        const company = j.employer_name ?? 'Empresa';
        const location = [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Não informado';
        const title = j.job_title ?? 'Vaga';
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: Boolean(j.job_is_remote),
          description: j.job_description ?? '',
          postedAt: j.job_posted_at_datetime_utc,
          source: 'jsearch',
          applyUrl: j.job_apply_link,
          publisher: j.job_publisher,
        };
      });
    } catch {
      return [];
    }
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/jsearch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/providers/jsearch.ts lib/__tests__/jsearch.test.ts; git commit -m "feat: provider JSearch (Google for Jobs/LinkedIn/Indeed)"
```

---

## Task 5: Busca agregada + dedup

**Files:**
- Create: `job-finder/lib/providers/index.ts`
- Test: `job-finder/lib/__tests__/aggregate.test.ts`

- [ ] **Step 1: Escrever teste**

Create `job-finder/lib/__tests__/aggregate.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { searchAllProviders } from '@/lib/providers';
import type { Job } from '@/lib/providers/types';

const mk = (id: string, source: any): Job => ({
  id, title: 'Dev', company: 'ACME', location: 'SP', remote: false,
  description: 'd', source, applyUrl: 'https://x.com/' + source,
});

describe('searchAllProviders', () => {
  it('agrega resultados de todos os providers e deduplica por id', async () => {
    const providers = [
      { name: 'adzuna', search: vi.fn(async () => [mk('dup', 'adzuna'), mk('a1', 'adzuna')]) },
      { name: 'remotive', search: vi.fn(async () => [mk('dup', 'remotive')]) },
    ] as any;
    const jobs = await searchAllProviders(['react'], {}, providers);
    const ids = jobs.map(j => j.id).sort();
    expect(ids).toEqual(['a1', 'dup']);
  });

  it('um provider que rejeita não derruba a busca', async () => {
    const providers = [
      { name: 'adzuna', search: vi.fn(async () => [mk('a1', 'adzuna')]) },
      { name: 'jsearch', search: vi.fn(async () => { throw new Error('boom'); }) },
    ] as any;
    const jobs = await searchAllProviders(['react'], {}, providers);
    expect(jobs.map(j => j.id)).toEqual(['a1']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/aggregate.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `job-finder/lib/providers/index.ts`:
```ts
import { Job, JobProvider, SearchOpts } from './types';
import { adzuna } from './adzuna';
import { remotive } from './remotive';
import { jsearch } from './jsearch';

export const defaultProviders: JobProvider[] = [jsearch, adzuna, remotive];

export async function searchAllProviders(
  queries: string[],
  opts: SearchOpts,
  providers: JobProvider[] = defaultProviders,
): Promise<Job[]> {
  const tasks: Promise<Job[]>[] = [];
  for (const provider of providers) {
    for (const query of queries) {
      tasks.push(provider.search(query, opts));
    }
  }
  const settled = await Promise.allSettled(tasks);
  const all: Job[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }
  const byId = new Map<string, Job>();
  for (const job of all) {
    if (!byId.has(job.id)) byId.set(job.id, job);
  }
  return [...byId.values()];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/aggregate.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```powershell
git add lib/providers/index.ts lib/__tests__/aggregate.test.ts; git commit -m "feat: busca agregada em paralelo com dedup e tolerância a falhas"
```

---

## Task 6: Parser de CV

**Files:**
- Create: `job-finder/lib/cv/parser.ts`
- Test: `job-finder/lib/__tests__/parser.test.ts`

- [ ] **Step 1: Escrever teste (TXT + roteamento por extensão)**

Create `job-finder/lib/__tests__/parser.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { extractText } from '@/lib/cv/parser';

vi.mock('mammoth', () => ({
  default: { extractRawText: vi.fn(async () => ({ value: 'texto do docx' })) },
}));
vi.mock('pdf-parse', () => ({
  default: vi.fn(async () => ({ text: 'texto do pdf' })),
}));

describe('extractText', () => {
  it('extrai texto de TXT', async () => {
    const buf = Buffer.from('meu curriculo em texto');
    const text = await extractText(buf, 'cv.txt');
    expect(text).toBe('meu curriculo em texto');
  });

  it('roteia .docx para mammoth', async () => {
    const text = await extractText(Buffer.from('x'), 'cv.docx');
    expect(text).toBe('texto do docx');
  });

  it('roteia .pdf para pdf-parse', async () => {
    const text = await extractText(Buffer.from('x'), 'cv.pdf');
    expect(text).toBe('texto do pdf');
  });

  it('lança erro para extensão não suportada', async () => {
    await expect(extractText(Buffer.from('x'), 'cv.xyz')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/parser.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `job-finder/lib/cv/parser.ts`:
```ts
import mammoth from 'mammoth';

/** Extrai texto cru de um CV. `buffer` é o conteúdo do arquivo; `fileName` define o formato. */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.txt') || lower.endsWith('.rtf')) {
    return buffer.toString('utf-8').trim();
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }
  if (lower.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text.trim();
  }
  throw new Error(`Formato não suportado: ${fileName}`);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/parser.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```powershell
git add lib/cv/parser.ts lib/__tests__/parser.test.ts; git commit -m "feat: parser de CV (PDF/DOCX/TXT) server-side"
```

---

## Task 7: Cliente Claude — análise do CV

**Files:**
- Create: `job-finder/lib/ai/claude.ts`
- Test: `job-finder/lib/__tests__/claude-analyze.test.ts`

- [ ] **Step 1: Escrever teste com SDK mockado**

Create `job-finder/lib/__tests__/claude-analyze.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';

const createMock = vi.fn(async () => ({
  content: [{ type: 'text', text: JSON.stringify({
    title: 'Desenvolvedor Frontend', seniority: 'pleno',
    skills: ['React', 'TypeScript'], areas: ['ti'],
    searchQueries: ['desenvolvedor react', 'frontend typescript'],
  }) }],
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: createMock }; },
}));

import { analyzeCV } from '@/lib/ai/claude';

describe('analyzeCV', () => {
  it('retorna um CVProfile válido a partir do texto', async () => {
    const profile = await analyzeCV('Sou dev React com 4 anos...');
    expect(profile.title).toBe('Desenvolvedor Frontend');
    expect(profile.seniority).toBe('pleno');
    expect(profile.searchQueries.length).toBeGreaterThan(0);
    expect(profile.rawText).toContain('React');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/claude-analyze.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `analyzeCV`**

Create `job-finder/lib/ai/claude.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk';
import { CVProfile, CVProfileSchema, Job, MatchResult, MatchResultSchema } from '@/lib/providers/types';

const MODEL = 'claude-sonnet-4-6';

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Resposta da IA sem JSON');
  return JSON.parse(match[0]);
}

export async function analyzeCV(rawText: string): Promise<CVProfile> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'Você analisa currículos e responde APENAS com JSON válido.',
    messages: [{
      role: 'user',
      content: `Analise este CV e responda com JSON no formato:
{"title": string, "seniority": "estagio"|"junior"|"pleno"|"senior"|"lead", "skills": string[], "areas": string[], "searchQueries": string[]}
- "searchQueries": 3 a 5 termos de busca de vaga ideais para este perfil.

CV:
"""${rawText.slice(0, 12000)}"""`,
    }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('');
  const parsed = extractJson(text);
  return CVProfileSchema.parse({ ...parsed, rawText });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/claude-analyze.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/ai/claude.ts lib/__tests__/claude-analyze.test.ts; git commit -m "feat: análise de CV com Claude (CVProfile estruturado)"
```

---

## Task 8: Claude — matching CV × vaga + ranking

**Files:**
- Modify: `job-finder/lib/ai/claude.ts` (adiciona `matchJob`)
- Create: `job-finder/lib/matching.ts`
- Test: `job-finder/lib/__tests__/matching.test.ts`

- [ ] **Step 1: Escrever teste de ranking com matchJob mockado**

Create `job-finder/lib/__tests__/matching.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import type { Job, CVProfile } from '@/lib/providers/types';

vi.mock('@/lib/ai/claude', () => ({
  matchJob: vi.fn(async (_cv: CVProfile, job: Job) => ({
    jobId: job.id, score: job.id === 'high' ? 90 : 40,
    reasons: ['r'], gaps: ['g'],
  })),
}));

import { rankJobs } from '@/lib/matching';

const cv = { title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: [], rawText: 'x' } as CVProfile;
const mk = (id: string): Job => ({
  id, title: 'Dev', company: 'A', location: 'SP', remote: false,
  description: 'd', source: 'adzuna', applyUrl: 'https://x.com/' + id,
});

describe('rankJobs', () => {
  it('ordena por score desc e anexa o match', async () => {
    const ranked = await rankJobs(cv, [mk('low'), mk('high')]);
    expect(ranked[0].job.id).toBe('high');
    expect(ranked[0].match.score).toBe(90);
    expect(ranked[1].job.id).toBe('low');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/matching.test.ts`
Expected: FAIL.

- [ ] **Step 3: Adicionar `matchJob` em `claude.ts`**

Append em `job-finder/lib/ai/claude.ts`:
```ts
export async function matchJob(cv: CVProfile, job: Job): Promise<MatchResult> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system: 'Você compara um CV com uma vaga e responde APENAS com JSON válido.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `CV do candidato:\n"""${cv.rawText.slice(0, 12000)}"""`,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `Vaga:\nTítulo: ${job.title}\nEmpresa: ${job.company}\nDescrição: ${job.description.slice(0, 6000)}

Responda com JSON: {"score": number 0-100, "reasons": string[] (por que combina), "gaps": string[] (o que falta no CV)}`,
        },
      ] as any,
    }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('');
  const parsed = extractJson(text);
  return MatchResultSchema.parse({ ...parsed, jobId: job.id });
}
```

- [ ] **Step 4: Implementar `rankJobs`**

Create `job-finder/lib/matching.ts`:
```ts
import { matchJob } from '@/lib/ai/claude';
import { CVProfile, Job, MatchResult } from '@/lib/providers/types';

export interface RankedJob {
  job: Job;
  match: MatchResult;
}

/** Pontua cada vaga contra o CV e devolve ordenado por score desc. */
export async function rankJobs(cv: CVProfile, jobs: Job[]): Promise<RankedJob[]> {
  const results = await Promise.allSettled(
    jobs.map(async (job): Promise<RankedJob> => ({ job, match: await matchJob(cv, job) })),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<RankedJob> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => b.match.score - a.match.score);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/matching.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add lib/ai/claude.ts lib/matching.ts lib/__tests__/matching.test.ts; git commit -m "feat: matching CV x vaga com Claude (prompt caching) + ranking"
```

---

## Task 9: API Routes

**Files:**
- Create: `job-finder/app/api/cv/analyze/route.ts`
- Create: `job-finder/app/api/jobs/search/route.ts`
- Create: `job-finder/app/api/jobs/match/route.ts`
- Test: `job-finder/lib/__tests__/api-routes.test.ts`

- [ ] **Step 1: Escrever teste das rotas (handlers chamados diretamente)**

Create `job-finder/lib/__tests__/api-routes.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/cv/parser', () => ({ extractText: vi.fn(async () => 'texto cv') }));
vi.mock('@/lib/ai/claude', () => ({
  analyzeCV: vi.fn(async () => ({ title: 'Dev', seniority: 'pleno', skills: [], areas: [], searchQueries: ['react'], rawText: 'texto cv' })),
}));
vi.mock('@/lib/providers', () => ({
  searchAllProviders: vi.fn(async () => [{ id: 'a1', title: 'Dev', company: 'A', location: 'SP', remote: false, description: 'd', source: 'adzuna', applyUrl: 'https://x.com/a1' }]),
}));

import { POST as searchPOST } from '@/app/api/jobs/search/route';

describe('POST /api/jobs/search', () => {
  it('retorna vagas para as queries enviadas', async () => {
    const req = new Request('http://x/api/jobs/search', {
      method: 'POST', body: JSON.stringify({ queries: ['react'], opts: {} }),
    });
    const res = await searchPOST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.jobs).toHaveLength(1);
    expect(json.jobs[0].applyUrl).toBe('https://x.com/a1');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/__tests__/api-routes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar rota de busca**

Create `job-finder/app/api/jobs/search/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { searchAllProviders } from '@/lib/providers';

export async function POST(req: Request) {
  try {
    const { queries, opts } = await req.json();
    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: 'queries obrigatórias' }, { status: 400 });
    }
    const jobs = await searchAllProviders(queries, opts ?? {});
    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json({ error: 'Falha na busca' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Implementar rota de análise de CV**

Create `job-finder/app/api/cv/analyze/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { extractText } from '@/lib/cv/parser';
import { analyzeCV } from '@/lib/ai/claude';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.name);
    if (!text || text.length < 30) {
      return NextResponse.json({ error: 'CV vazio ou ilegível. Tente outro formato.' }, { status: 422 });
    }
    const profile = await analyzeCV(text);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao analisar o CV' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Implementar rota de match**

Create `job-finder/app/api/jobs/match/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { rankJobs } from '@/lib/matching';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { profile, jobs } = await req.json();
    if (!profile || !Array.isArray(jobs)) {
      return NextResponse.json({ error: 'profile e jobs obrigatórios' }, { status: 400 });
    }
    const ranked = await rankJobs(profile, jobs.slice(0, 15));
    return NextResponse.json({ ranked });
  } catch (e) {
    return NextResponse.json({ error: 'Falha no matching' }, { status: 500 });
  }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run lib/__tests__/api-routes.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add app/api; git commit -m "feat: API routes para análise de CV, busca e matching"
```

---

## Task 10: Frontend — upload, resultados e perfil

> **REQUIRED SUB-SKILL nesta task:** Use `frontend-design:frontend-design` para o visual (moderno e energético, dark+light). O que segue define o comportamento e os dados; o frontend-design refina a estética.

**Files:**
- Create: `job-finder/components/CVUpload.tsx`, `JobCard.tsx`, `ScoreGauge.tsx`, `ThemeToggle.tsx`, `Filters.tsx`
- Modify: `job-finder/app/layout.tsx`, `job-finder/app/page.tsx`
- Create: `job-finder/app/resultados/page.tsx`, `job-finder/app/perfil/page.tsx`
- Create: `job-finder/lib/store.ts` (estado do CV/vagas via localStorage)

- [ ] **Step 1: Inicializar shadcn/ui**

Run (na pasta `job-finder`):
```powershell
npx shadcn@latest init -d
npx shadcn@latest add button card badge progress skeleton sonner
```

- [ ] **Step 2: Migrar componentes visuais reutilizáveis do legacy**

Copiar e adaptar de `job-finder-legacy/src/components/ui/`: `CircularGauge` → `ScoreGauge.tsx`, `ThemeToggle.jsx` → `ThemeToggle.tsx`, `TrustBadge.jsx` → badge da fonte (`source`/`publisher`). Converter para TypeScript e Tailwind do novo projeto.

- [ ] **Step 3: Criar store local (localStorage)**

Create `job-finder/lib/store.ts`:
```ts
'use client';
import { CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

const CV_KEY = 'jf_cv_profile';
const FAV_KEY = 'jf_favorites';

export function saveProfile(p: CVProfile) { localStorage.setItem(CV_KEY, JSON.stringify(p)); }
export function loadProfile(): CVProfile | null {
  const raw = localStorage.getItem(CV_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function getFavorites(): string[] {
  return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
}
export function toggleFavorite(jobId: string): string[] {
  const favs = new Set(getFavorites());
  favs.has(jobId) ? favs.delete(jobId) : favs.add(jobId);
  const arr = [...favs];
  localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  return arr;
}
```

- [ ] **Step 4: Componente `CVUpload`**

Create `job-finder/components/CVUpload.tsx` — drag&drop + input file. Ao soltar arquivo: `POST /api/cv/analyze` (FormData). Sucesso → `saveProfile(profile)` e `router.push('/resultados')`. Mostra progress + erros via `sonner`. Aceita `.pdf,.docx,.doc,.txt`.

- [ ] **Step 5: Página `resultados`**

Create `job-finder/app/resultados/page.tsx` (client) — ao montar: `loadProfile()`; se nulo → volta para `/`. Chama `POST /api/jobs/search` com `profile.searchQueries`, depois `POST /api/jobs/match` com `{profile, jobs}`. Renderiza `JobCard` por `RankedJob`, ordenado por score. `Filters.tsx` filtra por `remote`, `source` e score mínimo no client.

- [ ] **Step 6: Componente `JobCard`**

Create `job-finder/components/JobCard.tsx` — mostra título, empresa, local, badge da fonte (`publisher` quando houver), `ScoreGauge` com o score, lista `reasons` (✓) e `gaps` (⚠), botão "Candidatar-se" (link `applyUrl`, `target="_blank" rel="noopener noreferrer"`) e botão favoritar (`toggleFavorite`).

- [ ] **Step 7: Página `perfil`**

Create `job-finder/app/perfil/page.tsx` — exibe `CVProfile` salvo: cargo, senioridade, skills (badges), áreas, queries usadas na busca.

- [ ] **Step 8: Layout + landing**

Modify `job-finder/app/layout.tsx`: metadata PT-BR, `<Toaster />` do sonner, classe de tema. Modify `job-finder/app/page.tsx`: hero "moderno e energético" + `CVUpload` + explicação dos 3 passos.

- [ ] **Step 9: Verificar build e rodar dev**

Run:
```powershell
npm run build
```
Expected: build sem erros de tipo. Depois `npm run dev` e validar o fluxo manualmente com `.env.local` preenchido (upload → resultados → aplicar).

- [ ] **Step 10: Commit**

```powershell
git add app components lib/store.ts components.json; git commit -m "feat: frontend (upload, resultados, perfil) com shadcn/ui e tema dark/light"
```

---

## Task 11: README, limpeza e verificação final

**Files:**
- Create/Modify: `job-finder/README.md`
- Delete: `job-finder-legacy/`

- [ ] **Step 1: Escrever README**

Substituir `job-finder/README.md` com: descrição, stack, como obter cada chave (Anthropic, RapidAPI/JSearch, Adzuna), `cp .env.example .env.local`, `npm install`, `npm run dev`, `npm test`, e a nota legal de que as vagas vêm de agregadores (não scraping).

- [ ] **Step 2: Rodar a suíte completa**

Run: `npm test`
Expected: todos os testes PASS.

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 4: Remover o legacy**

Run (na raiz):
```powershell
Remove-Item -Recurse -Force job-finder-legacy
```

- [ ] **Step 5: Commit final**

```powershell
git add -A; git commit -m "docs: README do job-finder + remoção do protótipo legacy"
```

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura da spec:** §4 arquitetura → Tasks 1–10. §5 fluxo (analyze/search/match) → Tasks 6–9. §6 erros → tolerância em Tasks 5/9. §7 persistência (localStorage) → Task 10 (Supabase opcional fica para fora do MVP de código, só schema documentado na spec). §8 testes → Tasks 1–9. §9 env → Task 0. §11 migração visual → Task 10.
- **Persistência Supabase:** a spec marca login como "opcional/v2-friendly"; o MVP de código entrega localStorage (Task 10). Integração Supabase NÃO está nas tasks — é incremento posterior. Isso está coerente com "MVP focado primeiro".
- **Consistência de tipos:** `Job`, `CVProfile`, `MatchResult`, `JobProvider`, `RankedJob`, `searchAllProviders`, `analyzeCV`, `matchJob`, `rankJobs`, `extractText` usados de forma idêntica entre tasks.
- **Placeholders:** tasks de lógica (1–9) têm código completo e TDD. Task 10 (frontend) descreve comportamento + dados concretos e delega a estética ao frontend-design — apropriado para UI.
```
