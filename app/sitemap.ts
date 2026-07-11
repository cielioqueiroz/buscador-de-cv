import type { MetadataRoute } from 'next';

const SITE = 'https://vaga-certa-sooty.vercel.app';

/**
 * Só a home entra. /perfil e /resultados dependem de estado no localStorage —
 * sem CV enviado elas são páginas vazias, e listar página vazia no sitemap é
 * pedir para o Google penalizar o site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
