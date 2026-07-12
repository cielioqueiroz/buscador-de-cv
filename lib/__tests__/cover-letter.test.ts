import { describe, it, expect } from 'vitest';
import {
  CoverLetterSchema,
  CoverLetterRequestSchema,
  coverLetterFilename,
  coverLetterToText,
} from '@/lib/cover-letter';

const carta = {
  greeting: 'Prezado time da Acme,',
  paragraphs: ['Primeiro parágrafo.', 'Segundo parágrafo.'],
  closing: 'Atenciosamente, Ciélio.',
  keywords: ['React', 'TypeScript'],
};

describe('coverLetterToText', () => {
  it('junta saudação, parágrafos e fecho com linha em branco entre eles', () => {
    expect(coverLetterToText(carta)).toBe(
      'Prezado time da Acme,\n\nPrimeiro parágrafo.\n\nSegundo parágrafo.\n\nAtenciosamente, Ciélio.',
    );
  });

  it('o texto sobrevive à ida e volta pela quebra de parágrafo', () => {
    // O <textarea> edita o texto plano e a folha de impressão o divide de volta
    // em parágrafos: os dois lados têm que concordar sobre o separador.
    const partes = coverLetterToText(carta).split(/\n{2,}/);
    expect(partes).toHaveLength(4);
  });
});

describe('coverLetterFilename', () => {
  it('tira acento e caractere que quebra download', () => {
    expect(coverLetterFilename('Solução / Tech Ltda.')).toBe('carta-solucao-tech-ltda.txt');
  });

  it('não deixa o nome terminar em hífen depois do corte', () => {
    const nome = coverLetterFilename('A'.repeat(60));
    expect(nome.endsWith('-.txt')).toBe(false);
  });

  it('empresa sem letra nenhuma ainda gera nome válido', () => {
    expect(coverLetterFilename('***')).toBe('carta-vaga.txt');
  });
});

describe('CoverLetterSchema', () => {
  it('aceita a carta bem formada', () => {
    expect(CoverLetterSchema.safeParse(carta).success).toBe(true);
  });

  it('recusa carta de um parágrafo só — isso não é carta, é bilhete', () => {
    expect(CoverLetterSchema.safeParse({ ...carta, paragraphs: ['um'] }).success).toBe(false);
  });

  it('recusa parágrafo vazio, que renderizaria um buraco na folha', () => {
    expect(CoverLetterSchema.safeParse({ ...carta, paragraphs: ['ok', ''] }).success).toBe(false);
  });

  it('keywords vazias passam: a IA pode não achar termo aproveitável', () => {
    expect(CoverLetterSchema.safeParse({ ...carta, keywords: [] }).success).toBe(true);
  });
});

describe('CoverLetterRequestSchema', () => {
  const base = {
    profile: {
      title: 'Dev',
      seniority: 'pleno',
      skills: ['React'],
      areas: ['ti'],
      searchQueries: ['react'],
      rawText: 'cv',
    },
    job: {
      id: 'j1',
      title: 'Dev',
      company: 'Acme',
      location: 'SP',
      remote: false,
      description: 'vaga',
      source: 'adzuna',
      applyUrl: 'https://acme.com/j1',
    },
    tone: 'formal',
    length: 'curta',
  };

  it('aceita um corpo completo', () => {
    expect(CoverLetterRequestSchema.safeParse(base).success).toBe(true);
  });

  it('recusa tom inventado — o prompt só sabe lidar com os três', () => {
    expect(CoverLetterRequestSchema.safeParse({ ...base, tone: 'sarcastico' }).success).toBe(false);
  });

  it('recusa tamanho fora do enum', () => {
    expect(CoverLetterRequestSchema.safeParse({ ...base, length: 'gigante' }).success).toBe(false);
  });
});
