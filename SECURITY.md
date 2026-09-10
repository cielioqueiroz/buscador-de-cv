# Segurança

## Checklist aplicado

| Controle | Situação | Implementação |
| --- | --- | --- |
| API keys | Ativo | Variáveis server-only; nenhum `NEXT_PUBLIC_*` para credenciais de providers. |
| Secrets no Git | Ativo | `.env*` ignorado, com exceção apenas de `.env.example`; histórico rastreado sem arquivo de segredo. |
| Public key de banco / RLS | N/A | Não existe banco de dados neste produto. |
| Criptografia | Limite documentado | Não há armazenamento persistente no servidor; o `localStorage` não é tratado como cofre. |
| Auth server-side / acessos | N/A + proteção ativa | O app é anônimo; origem, payload, formatos e custo das rotas são restringidos. |
| Mass assignment | Ativo | Schemas Zod aceitam somente contratos conhecidos e removem campos extras antes do uso. |
| Cookies / senhas | N/A | O app não cria sessão, cookie de autenticação ou senha. |
| Rate limit / bots | Ativo com limite operacional | Rate limit por IP, `Retry-After` e guarda same-origin; proteção distribuída/CAPTCHA fica na borda quando o tráfego exigir. |
| Queries parametrizadas | N/A | Não há SQL; parâmetros de APIs externas usam `URLSearchParams`. |
| Vazamento de conteúdo | Ativo | Erros públicos são genéricos; CV, prompts e chaves não são devolvidos nos logs/respostas. |
| Uploads | Ativo | Allowlist, limite de 8 MB, assinatura binária e limite de texto/páginas. |
| Respostas de API | Ativo | Dados externos e IA passam por schemas; APIs usam `no-store` e respostas 429 informam retry. |
| Headers / HTTPS | Ativo em produção | CSP, anti-frame, `nosniff`, HSTS, políticas de origem e redirect HTTP→HTTPS. |
| Dependências | Ativo | `npm audit --omit=dev` deve permanecer sem vulnerabilidades. |

## Controles ativos

- Chaves de Gemini, RapidAPI e Adzuna são lidas apenas no servidor e ficam fora do Git por `.gitignore`.
- Rotas rejeitam chamadas cross-site, limitam o corpo, validam JSON com Zod e retornam respostas sem cache.
- Uploads aceitam somente PDF, Word (`.doc`/`.docx`), TXT, Markdown, RTF e CSV; há limite de 8 MB, validação de assinatura binária e limite de texto/PDF.
- Dados dos providers e da IA são normalizados contra schemas antes de alcançar a interface ou outra chamada.
- Rate limit por IP protege análise, busca, matching e geração de carta; respostas `429` informam `Retry-After`.
- CSP, HSTS em produção, `nosniff`, anti-frame, políticas de origem/referer/permissões e `no-store` nas APIs estão configurados em `next.config.ts`.
- Dependências de produção são verificadas com `npm audit --omit=dev`.

## O que não se aplica ao produto atual

O projeto não possui banco de dados, autenticação, sessões/cookies de usuário ou queries SQL. Por isso public key de banco, RLS, hash de senha, auth server-side e queries parametrizadas não são controles ausentes: não há esses subsistemas para proteger.

O perfil e o ranking ficam no `localStorage` para permitir uso sem cadastro. Isso não é criptografia em repouso e não deve ser tratado como armazenamento seguro contra XSS ou contra alguém com acesso ao navegador. A proteção adequada para esse cenário é manter as chaves no servidor, reduzir a retenção e preservar CSP/validação; criptografia persistente exigiria uma chave fornecida pelo usuário ou uma conta autenticada.

## Limitações operacionais

O rate limit local é uma barreira contra abuso casual. Em serverless com múltiplas instâncias, a proteção forte deve ser complementada por firewall/rate limit distribuído da plataforma (por exemplo, Vercel Firewall ou Upstash). Bot protection interativo só deve ser introduzido se o tráfego real justificar o atrito de CAPTCHA.

## Verificação local

```bash
npm audit --omit=dev
npm run lint
npm test -- --run
npm run build
```
