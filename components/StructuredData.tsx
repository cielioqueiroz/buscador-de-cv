const SITE = 'https://vaga-certa-sooty.vercel.app';

/**
 * JSON-LD: é assim que o Google (e o ChatGPT, o Perplexity, o AI Overviews)
 * entendem *o que* é este site em vez de adivinhar pelo texto.
 *
 * Nota sobre FAQPage: o Google aposentou os rich results de FAQ em maio/2026 —
 * não aparece mais destaque na SERP. Ainda assim vale marcar, porque os motores
 * de IA usam esse bloco para citar respostas.
 */
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE}/#app`,
      name: 'Vaga Certa',
      url: SITE,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'pt-BR',
      description:
        'Ferramenta gratuita que analisa seu currículo com IA, busca vagas reais no Brasil e ' +
        'pontua a compatibilidade de cada uma de 0 a 100, explicando os motivos do match e o que falta no seu perfil.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
      },
      featureList: [
        'Análise de currículo com IA (PDF, DOCX, TXT, XLSX)',
        'Busca de vagas reais em Adzuna, Remotive e Google for Jobs',
        'Score de compatibilidade de 0 a 100 por vaga',
        'Motivos do match e lacunas do currículo',
        'Link oficial de candidatura, sem intermediário',
        'Sem cadastro — os dados ficam no navegador',
      ],
      author: {
        '@type': 'Person',
        name: 'Jacielio Queiroz',
        url: 'https://cielio-portfolio.vercel.app',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Como encontrar vagas de emprego usando o currículo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Envie seu currículo em PDF, DOCX ou TXT no Vaga Certa. A IA lê o documento, ' +
              'extrai seu cargo, senioridade e habilidades, e gera as buscas ideais para o seu perfil. ' +
              'Em seguida, busca vagas reais em agregadores legais e pontua cada uma de 0 a 100 conforme ' +
              'a compatibilidade com o que você sabe fazer.',
          },
        },
        {
          '@type': 'Question',
          name: 'O Vaga Certa é gratuito?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Sim, é gratuito e não exige cadastro. Seus dados ficam no seu próprio navegador ' +
              '(localStorage) e o currículo é lido no servidor apenas para gerar a análise.',
          },
        },
        {
          '@type': 'Question',
          name: 'De onde vêm as vagas?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'De agregadores legais: Adzuna (vagas no Brasil), Remotive (vagas remotas) e ' +
              'Google for Jobs, que indexa LinkedIn, Indeed, Glassdoor, Gupy, Catho e outros. ' +
              'Não fazemos scraping, e o botão de candidatura sempre leva ao anúncio oficial.',
          },
        },
        {
          '@type': 'Question',
          name: 'O que significa a nota de compatibilidade da vaga?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'É uma nota de 0 a 100 que a IA atribui comparando o seu currículo com a descrição ' +
              'da vaga. Junto com a nota, o Vaga Certa mostra os motivos a favor (o que do seu perfil ' +
              'combina) e as lacunas (o que a vaga pede e não está no seu currículo).',
          },
        },
      ],
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // O JSON é estático e não contém entrada de usuário.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
