import type { SearchOpts } from '@/lib/journey';
import type { SavedRegion } from '@/lib/store';

/**
 * A região escolhida em "Onde" traduzida para o que a busca entende. Vive aqui,
 * e não no formulário, porque três caminhos buscam: o próprio formulário, a
 * busca automática de /resultados sem ranking e o "Buscar vagas novas" — e os
 * três precisam buscar no mesmo lugar que o filtro mostra.
 */
export function regionToOpts(region: SavedRegion | null): SearchOpts {
  if (!region) return {};
  const cidade = region.cidade.trim();
  if (region.escopo === 'br') {
    return {
      country: 'br',
      location: cidade ? (region.uf ? `${cidade}, ${region.uf}` : cidade) : region.uf || undefined,
    };
  }
  if (region.escopo === 'intl') return { country: region.pais, location: cidade || undefined };
  return {};
}
