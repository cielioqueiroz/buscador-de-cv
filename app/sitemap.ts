import type { MetadataRoute } from 'next';

const SITE = 'https://vaga-certa-sooty.vercel.app';

/**
 * Só páginas públicas entram: a home e a política de privacidade. As páginas
 * de conta exigem login — para o robô seriam só um redirect para /entrar.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
