# AGENTS.md — Vaga Certa

Este arquivo orienta agentes que trabalham neste repositório. O README explica o produto e o uso local; este documento explica como alterar o código com segurança e preservar as decisões já tomadas.

## Objetivo do projeto

O Vaga Certa recebe um currículo, extrai um perfil com IA, busca vagas reais, calcula compatibilidade e permite gerar uma carta específica por vaga. O produto não exige cadastro: o estado do usuário fica no navegador e as chaves de integração ficam no servidor.

## Antes de editar

1. Leia `README.md` quando a mudança envolver comportamento do produto, provedores, deploy ou documentação.
2. Consulte `package.json` para descobrir os scripts atuais; ele é a fonte de verdade para comandos.
3. Confira `git status --short` e preserve mudanças existentes que não pertencem à tarefa.
4. Identifique o módulo e a interface que devem mudar antes de espalhar lógica pelos chamadores.

## Mapa do código

```text
app/
  api/                  rotas HTTP e composição dos módulos de domínio
  candidaturas/         tracker Kanban local de candidaturas
  perfil/               visualização do perfil salvo
  resultados/           ranking, filtros e ações das vagas
  page.tsx              landing page e ponto de entrada do upload
components/             interface visual e interações do navegador
lib/
  ai/                   adapter do Gemini e contratos de resposta
  api/                  leitura limitada e validação de requisições
  cv/                   parsing seguro dos formatos aceitos
  cv-features.ts        schemas de adaptação e relatório do CV
  applications.ts       persistência validada do tracker local
  providers/            adapters de fontes de vagas + agregação
  __tests__/            testes de módulos e rotas
  journey.ts            fluxo do upload até o ranking
  matching.ts            pontuação e ordenação
  store.ts              persistência validada no localStorage
docs/                   especificações de design históricas
assets/                 screenshots e material visual do README
```

Prefira módulos profundos: uma interface pequena deve esconder validação, normalização, tratamento de erro e detalhes de integração. As rotas devem compor módulos; não devem duplicar regras de parsing, schemas ou chamadas externas.

## Regras de segurança

- Nunca exponha `GEMINI_API_KEY`, `RAPIDAPI_KEY`, `ADZUNA_APP_ID` ou `ADZUNA_APP_KEY` no cliente.
- Trate todo payload do navegador, da IA e dos provedores externos como não confiável.
- Use os schemas de `lib/providers/types.ts`, `lib/cover-letter.ts` ou o schema específico do módulo antes de aceitar dados.
- Para JSON HTTP, use `readJson` de `lib/api/request.ts`; preserve limites de tamanho e a guarda de origem.
- Para fontes externas, use `fetchJson` de `lib/providers/http.ts`, com timeout e normalização do resultado.
- URLs de candidatura devem permanecer HTTP(S). Não introduza `dangerouslySetInnerHTML` com entrada de usuário.
- O upload aceita PDF, Word (`.doc`/`.docx`), TXT, Markdown, RTF e CSV. Novos formatos binários exigem parser aprovado, validação de assinatura e teste de regressão.
- Não aumente limites de payload ou de custo sem adicionar justificativa, teste e proteção equivalente.

## Padrões de frontend

- Use os tokens semânticos de `app/globals.css` (`--accent`, `--surface`, `--muted`, `--border`, etc.); não espalhe cores hexadecimais novas pelos componentes.
- Preserve `prefers-reduced-motion`, estados de foco visíveis, nomes acessíveis e navegação por teclado.
- Botões devem declarar `type="button"` quando não forem submit. Controles de ícone precisam de `aria-label`.
- Para âncoras internas, use um `id` estável no destino e `scroll-mt-*` quando houver header fixo.
- O PDF da carta é gerado pela impressão nativa do navegador; não reintroduza uma biblioteca de PDF sem revisão de segurança e bundle.

## Testes e validação

Depois de alterar código, rode pelo menos:

```bash
npm run lint
npm test -- --run
npx tsc --noEmit
```

Para mudanças em rotas, parsing, dependências ou build, rode também:

```bash
npm run build
npm audit --omit=dev
```

Não faça chamadas reais ao Gemini ou aos provedores nos testes. Use adapters falsos, fixtures e mocks. Toda correção de bug deve incluir uma regressão quando houver uma interface testável.

## Organização de mudanças

- Rotas ficam em `app/api`; regras compartilhadas ficam em `lib`.
- Um novo provider deve implementar `JobProvider`, normalizar para `JobSchema` e ter testes próprios.
- Um novo contrato de entrada/saída deve nascer como schema Zod perto do módulo que o possui.
- Não crie utilitários genéricos em componentes quando a lógica pertence a um módulo de domínio.
- Mantenha documentação sincronizada com formatos aceitos, providers, scripts e decisões de produto.
- Evite renomear ou mover arquivos sem atualizar imports, testes e README.

## Git e conclusão

Use commits convencionais e focados, por exemplo `fix(ui): ...`, `feat(api): ...` ou `docs: ...`. Antes de concluir:

- confirme que os testes e o build relevantes passaram;
- revise `git diff --check`;
- confirme que nenhum `.env`, segredo, build ou arquivo temporário foi incluído;
- informe limitações intencionais e arquivos principais alterados.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
