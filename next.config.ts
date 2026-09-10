import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Esconde o indicador/logo de desenvolvimento do Next no canto da tela.
  devIndicators: false,
  async headers() {
    const devScriptPolicy = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${devScriptPolicy}; connect-src 'self'; worker-src 'self' blob:;` },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    ];

    // HSTS só deve ser emitido em HTTPS de produção; em desenvolvimento ele
    // faria o navegador tentar abrir localhost com HTTPS depois do primeiro acesso.
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },
};

export default nextConfig;
