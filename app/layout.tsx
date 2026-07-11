import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { StructuredData } from "@/components/StructuredData";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE = "https://vaga-certa-sooty.vercel.app";
const TITULO = "Vaga Certa — encontre vagas pelo seu currículo, com IA";
const DESCRICAO =
  "Envie seu currículo e a IA encontra vagas reais no Brasil que combinam com o seu perfil — " +
  "com nota de compatibilidade de 0 a 100, os motivos do match e o link oficial de candidatura. Grátis, sem cadastro.";

export const metadata: Metadata = {
  // Sem metadataBase o Next não consegue montar as URLs absolutas que o
  // Open Graph exige, e o card de compartilhamento sai sem imagem.
  metadataBase: new URL(SITE),
  title: {
    default: TITULO,
    template: "%s · Vaga Certa",
  },
  description: DESCRICAO,
  applicationName: "Vaga Certa",
  authors: [{ name: "Ciélio Queiroz", url: "https://cielio-portfolio.vercel.app" }],
  creator: "Ciélio Queiroz",
  keywords: [
    "vagas de emprego",
    "buscar vagas com currículo",
    "encontrar vagas com IA",
    "análise de currículo com IA",
    "compatibilidade currículo vaga",
    "vagas para o meu perfil",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE,
    siteName: "Vaga Certa",
    title: TITULO,
    description: DESCRICAO,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0c",
};

// Define o tema antes da pintura para evitar flash. Padrão: escuro.
const themeScript = `
(function(){try{
  var t = localStorage.getItem('jf_theme');
  if(t === 'light'){document.documentElement.classList.remove('dark');}
  else{document.documentElement.classList.add('dark');}
}catch(e){document.documentElement.classList.add('dark');}})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <StructuredData />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
