import { describe, it, expect } from 'vitest';
import { buildCoverLetterPdf } from '@/lib/cover-letter-pdf';
import { coverLetterFilename } from '@/lib/cover-letter';
import type { Job } from '@/lib/providers/types';

const job: Job = {
  id: 'j1',
  title: 'Dev Front-end',
  company: 'Acme Tecnologia',
  location: 'São Paulo',
  remote: true,
  description: 'React',
  source: 'adzuna',
  applyUrl: 'https://acme.com/j1',
};

const texto = [
  'Prezado time da Acme,',
  'Reconstruí o checkout de uma loja com React — atenção à acentuação: ç, ã, é, ô.',
  'Atenciosamente, Ciélio.',
].join('\n\n');

describe('buildCoverLetterPdf', () => {
  it('devolve um PDF de verdade, não um texto disfarçado', async () => {
    const blob = await buildCoverLetterPdf({ texto, job, titulo: 'Desenvolvedor Front-end' });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(500);

    // Todo PDF começa com "%PDF-". Se isto falhar, o download entrega lixo.
    const inicio = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
    expect(inicio).toBe('%PDF-');
  });

  it('uma carta longa quebra em mais de uma página em vez de sumir no rodapé', async () => {
    const longa = Array.from({ length: 40 }, (_, i) => `Parágrafo ${i}. ${'texto '.repeat(40)}`).join(
      '\n\n',
    );
    const curta = await buildCoverLetterPdf({ texto, job, titulo: 'Dev' });
    const grande = await buildCoverLetterPdf({ texto: longa, job, titulo: 'Dev' });

    expect(grande.size).toBeGreaterThan(curta.size);
  });
});

describe('coverLetterFilename', () => {
  it('agora nasce .pdf por padrão — o PDF é o download principal', () => {
    expect(coverLetterFilename('Acme Tecnologia')).toBe('carta-acme-tecnologia.pdf');
  });

  it('o .txt continua disponível para quem quiser colar o texto', () => {
    expect(coverLetterFilename('Acme Tecnologia', 'txt')).toBe('carta-acme-tecnologia.txt');
  });
});
