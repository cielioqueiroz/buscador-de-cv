'use client';

/**
 * O erro que todo site publicado sofre e quase nenhum trata.
 *
 * Quando um deploy novo entra no ar, os arquivos JS ganham hashes novos e os
 * antigos deixam de existir. Quem estava com a aba aberta continua rodando o
 * JS velho — e, ao navegar para outra página, o Next vai buscar um pedaço
 * (`chunk`) do build anterior. A resposta é 404 e a aplicação inteira cai com
 * `ChunkLoadError: Loading chunk 49 failed`.
 *
 * Visto em produção: a aba estava aberta durante um deploy, e ir para
 * /resultados derrubou o app numa tela em inglês — com o currículo já enviado.
 *
 * Não é bug de código nosso, e nenhuma mudança de código o previne: é a
 * natureza de publicar. O que dá para fazer é recuperar — recarregar a página
 * busca o HTML novo, que aponta para os arquivos novos, e o usuário volta ao
 * lugar onde estava (o perfil e o ranking vivem no localStorage, que a recarga
 * não apaga).
 */

export const CHAVE_RECARGA = 'jf_recarga_deploy';

/**
 * Mensagens de cada navegador para a mesma coisa. O `name` é o sinal do
 * webpack; as mensagens cobrem o Vite/ESM e o Safari, que não usam esse nome.
 */
const SINAIS = [
  'loading chunk',
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'error loading dynamically imported module',
];

export function ehErroDeDeploy(error: Error): boolean {
  if (error.name === 'ChunkLoadError') return true;

  const msg = error.message?.toLowerCase() ?? '';
  return SINAIS.some((s) => msg.includes(s));
}

/**
 * Uma recarga imediatamente depois da outra é laço; uma hora depois é outro
 * deploy. O tempo distingue os dois casos, coisa que uma flag booleana não faz:
 * com ela, quem ficasse com a aba aberta por dois deploys perderia o segundo
 * resgate para sempre.
 */
const JANELA_DE_LACO_MS = 15_000;

/**
 * Recarrega — mas nunca em laço.
 *
 * Se o mesmo erro voltar logo após a recarga, então não era deploy: era um bug
 * de verdade, e recarregar de novo prenderia o usuário numa tela piscando sem
 * fim. Aí devolvemos `false` e quem chamou mostra a tela de erro, que é a
 * resposta honesta.
 *
 * @returns `true` se a recarga foi disparada (a tela de erro não deve aparecer).
 */
export function recuperarDeDeploy(
  error: Error,
  recarregar: () => void = () => window.location.reload(),
  agora: number = Date.now(),
): boolean {
  if (!ehErroDeDeploy(error)) return false;

  try {
    const ultima = Number(sessionStorage.getItem(CHAVE_RECARGA) ?? 0);
    if (ultima && agora - ultima < JANELA_DE_LACO_MS) return false;
    sessionStorage.setItem(CHAVE_RECARGA, String(agora));
  } catch {
    // sessionStorage bloqueado (modo privado do Safari). Sem a marca não dá
    // para detectar o laço, mas recarregar uma vez ainda é o certo: a chance de
    // resolver é alta, e a de laçar, baixa.
  }

  recarregar();
  return true;
}
