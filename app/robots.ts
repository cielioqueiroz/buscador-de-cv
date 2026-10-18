import type { MetadataRoute } from 'next';

const SITE = 'https://vaga-certa-sooty.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // As áreas da conta exigem login: para o robô são só um redirecionamento
        // para /entrar, e rastreá-las gasta orçamento de rastreio à toa (elas já
        // têm noindex). As rotas de API não têm nada a indexar.
        disallow: ['/perfil', '/resultados', '/candidaturas', '/conta', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
