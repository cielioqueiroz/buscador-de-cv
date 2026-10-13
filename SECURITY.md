# Segurança

## Checklist aplicado

| Controle | Situação | Implementação |
| --- | --- | --- |
| API keys | Ativo | Variáveis server-only; nenhum `NEXT_PUBLIC_*` para credenciais de providers. |
| Secrets no Git | Ativo | `.env*` ignorado, com exceção apenas de `.env.example`; histórico rastreado sem arquivo de segredo. |
| Banco / isolamento por usuário | Ativo, com RLS | Neon Postgres acessado só pelo servidor (`DATABASE_URL` server-only). Toda query de dado do usuário filtra pelo `user_id` da sessão e roda via `lib/db/user-scope.ts`, que troca para a role `vaga_certa_rls` (sem BYPASSRLS) e informa o usuário; as políticas de `db/migrations/0006_rls.sql` só deixam ver e gravar as próprias linhas. |
| Criptografia | Limite documentado | Neon criptografa em repouso e exige TLS. Senhas só como hash bcrypt; tokens de reset só como hash SHA-256. O `localStorage` é só cache das telas e não é tratado como cofre. |
| Auth server-side / acessos | Ativo | Conta obrigatória para usar o app, com NextAuth v5 (e-mail/senha e, quando configurado, Google). Rotas de IA, busca, conta e sync checam a sessão no servidor e devolvem 401 sem ela; páginas de conta redirecionam para `/entrar`. A landing é pública. |
| Mass assignment | Ativo | Schemas Zod aceitam somente contratos conhecidos e removem campos extras antes do uso. |
| Cookies / senhas | Ativo | Sessão JWT em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção (padrões do NextAuth), assinada com `AUTH_SECRET`. Senha: mínimo 8 caracteres com letra e número, bcrypt com 12 rounds. Reset: token aleatório de uso único, 30 minutos, tokens antigos invalidados; respostas idênticas para e-mail existente ou não. |
| Rate limit / bots | Ativo com limite operacional | Rate limit por IP, `Retry-After` e guarda same-origin. Distribuído via Upstash Redis quando as variáveis existem; sem elas, cai para o limiter em memória. CAPTCHA fica na borda quando o tráfego exigir. |
| Queries parametrizadas | Ativo | Todo SQL usa parâmetros posicionais (`$1`, `$2`…) do driver; nenhum valor é concatenado na query. Parâmetros de APIs externas usam `URLSearchParams`. |
| Vazamento de conteúdo | Ativo | Erros públicos são genéricos; CV, prompts e chaves não são devolvidos nos logs/respostas. |
| Uploads | Ativo | CV: allowlist, limite de 8 MB, assinatura binária e limite de texto/páginas. Foto de perfil: só JPEG/PNG/WebP por assinatura, 2 MB, teto de pixels e re-encode com `sharp` para WebP 256×256 sem metadados. |
| Respostas de API | Ativo | Dados externos e IA passam por schemas; APIs usam `no-store` e respostas 429 informam retry. |
| Headers / HTTPS | Ativo em produção | CSP, anti-frame, `nosniff`, HSTS, políticas de origem e redirect HTTP→HTTPS. |
| Dependências | Ativo | `npm audit --omit=dev` deve permanecer sem vulnerabilidades. |

## Controles ativos

- Chaves de Gemini, RapidAPI, Adzuna, Resend, Google OAuth, o token REST do Upstash, `DATABASE_URL` e `AUTH_SECRET` são lidas apenas no servidor e ficam fora do Git por `.gitignore`.
- Rotas rejeitam chamadas cross-site, limitam o corpo, validam JSON com Zod e retornam respostas sem cache.
- Uploads aceitam somente PDF, Word (`.doc`/`.docx`), TXT, Markdown, RTF e CSV; há limite de 8 MB, validação de assinatura binária e limite de texto/PDF.
- Dados dos providers e da IA são normalizados contra schemas antes de alcançar a interface ou outra chamada.
- Rate limit por IP protege análise, busca, matching e geração de carta; respostas `429` informam `Retry-After`. Cadastro e "esqueci a senha" somam um limite por e-mail ao limite por IP; rotas de conta e sync limitam por usuário.
- A foto de perfil é servida em `/api/perfil/avatar` sem id na URL: só devolve a foto de quem está logado, com `Content-Security-Policy: default-src 'none'`.
- Na sessão, `update()` do cliente só sinaliza que algo mudou; nome, e-mail e foto são relidos do banco, nunca aceitos do navegador.
- CSP, HSTS em produção, `nosniff`, anti-frame, políticas de origem/referer/permissões e `no-store` nas APIs estão configurados em `next.config.ts`.
- Dependências de produção são verificadas com `npm audit --omit=dev`.

## Conta e dados no navegador

Desde 2026-10-13 o app exige conta. O navegador ainda guarda uma cópia do perfil e do ranking no `localStorage`, como cache das telas de vagas; o logout apaga essa cópia, para o próximo usuário do mesmo computador não herdar nada. Isso não é criptografia em repouso e não deve ser tratado como armazenamento seguro contra XSS ou contra alguém com acesso ao navegador. A proteção adequada para esse cenário é manter as chaves no servidor, reduzir a retenção e preservar CSP/validação; criptografia persistente exigiria uma chave fornecida pelo usuário ou uma conta autenticada.

Com conta, perfil, tracker, favoritos, cartas, CVs adaptados e foto ficam no Neon, ligados ao usuário com `on delete cascade`. O texto do CV é enviado ao Gemini para análise.

Em `/conta` o usuário baixa um JSON com todos os seus dados e exclui a conta (confirma digitando o e-mail e, se houver, a senha; limite de 5 tentativas por hora). Como a sessão é um JWT de 30 dias, as rotas de IA conferem no banco que o usuário ainda existe — conta excluída num aparelho para de funcionar nos outros.

O RLS é a segunda barreira: perfil, tracker, favoritos, cartas, CVs adaptados e foto têm política `user_id = app_user_id()` com `FORCE`. Detalhe importante do Neon: a role dona do banco tem `BYPASSRLS` e ignora qualquer política, por isso as consultas trocam para `vaga_certa_rls` dentro da transação (`set local role`). Validado contra o Postgres real: outro usuário não lê, não altera nem grava em nome alheio, e sem contexto nada é visível.

Ainda faltam, e estão no roadmap: verificação de e-mail no cadastro e troca de e-mail com verificação.

## Limitações operacionais

O rate limit tem duas formas. Sem Redis configurado, usa um contador em memória por instância — barreira contra abuso casual, mas em serverless com múltiplas instâncias o teto real é `limite × nº de instâncias`. Com `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` definidos, o teto por IP passa a ser compartilhado (janela deslizante no Upstash), valendo para o app inteiro — recomendado em produção, já que num app aberto este é o principal freio da cota paga do Gemini. Se o Redis ficar indisponível, o app degrada para o limiter em memória em vez de falhar. Bot protection interativo (CAPTCHA) só deve ser introduzido se o tráfego real justificar o atrito.

## CSP: por que `script-src` ainda aceita `'unsafe-inline'`

A política bloqueia os vetores principais: `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'none'`, `connect-src 'self'` e nenhum script externo. Resta o
`'unsafe-inline'` em `script-src`, exigido pelos scripts inline do próprio Next
(hidratação) e pelo pequeno script anti-FOUC de tema.

Removê-lo com segurança no Next exige **nonce por requisição via proxy**, o que
força renderização dinâmica de todas as páginas — perdendo a otimização estática
e o cache de HTML na borda. O ganho seria marginal neste app: **não há sink de
HTML injetável**. O conteúdo não confiável (texto do CV, descrições de vaga) é
renderizado como texto pelo React; `dangerouslySetInnerHTML` com entrada de
usuário é proibido por convenção. Por isso o `'unsafe-inline'` em `script-src` é
um risco aceito e limitado, não um controle esquecido. Se um dia o app passar a
renderizar HTML dinâmico de terceiros, a CSP estrita com nonce passa a valer o
custo.

## Verificação local

```bash
npm audit --omit=dev
npm run lint
npm test -- --run
npm run build
```
