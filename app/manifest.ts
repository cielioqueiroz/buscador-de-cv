import type { MetadataRoute } from 'next';

/**
 * Web App Manifest: torna o Vaga Certa instalável ("adicionar à tela inicial")
 * e dá aparência de app ao abrir. Um app sem cadastro, cujo estado vive no
 * próprio navegador, é candidato natural a isso.
 *
 * Deliberadamente SEM service worker: o app depende de rede para a função
 * principal (IA e provedores), e um SW com cache agressivo brigaria com o
 * deploy-recovery de chunks. Instalação e lançamento como app já entregam o
 * valor; offline não é o objetivo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vaga Certa',
    short_name: 'Vaga Certa',
    description:
      'Envie seu currículo e a IA encontra vagas reais que combinam com o seu perfil, com nota de compatibilidade e o link oficial.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    lang: 'pt-BR',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
      { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
    ],
  };
}
