'use client';

/**
 * Limpeza do que a conta deixa neste navegador. Fica fora de lib/store.ts de
 * propósito: o menu do usuário (presente em todas as páginas) só precisa disto,
 * e importar lib/store puxava o Zod inteiro (~137 KB) para o bundle de cada
 * página, inclusive as estáticas.
 */

// Perfil e ranking moram na conta; as duas primeiras chaves são de quando o
// navegador guardava cópias e só ficam para serem apagadas.
export const LEGACY_CV_KEY = 'jf_cv_profile';
export const LEGACY_RANKED_KEY = 'jf_ranked';
export const FAV_KEY = 'jf_favorites';
export const LETTERS_KEY = 'jf_letters';
/** Vive em lib/applications.ts, que valida com Zod; aqui só o nome. */
const APPLICATIONS_KEY = 'jf_applications';

export function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* storage indisponível */ }
}

/**
 * Apaga deste navegador tudo que pertence à conta: perfil, ranking, cartas,
 * favoritos e tracker. Roda no logout para o próximo usuário do mesmo
 * computador não herdar nada. Tema e região são preferências do aparelho e ficam.
 */
export function clearLocalUserData() {
  for (const key of [LEGACY_CV_KEY, LEGACY_RANKED_KEY, LETTERS_KEY, FAV_KEY, APPLICATIONS_KEY]) {
    safeRemove(key);
  }
}
