import type { MetadataRoute } from 'next';

const SITE = 'https://vaga-certa-sooty.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /perfil e /resultados só têm conteúdo depois que o usuário sobe um CV
        // (o estado vive no localStorage). Para o Google elas são cascas vazias
        // — 8 e 98 palavras — e páginas vazias indexadas puxam o site inteiro
        // para baixo. As rotas de API não têm nada a indexar.
        disallow: ['/perfil', '/resultados', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
