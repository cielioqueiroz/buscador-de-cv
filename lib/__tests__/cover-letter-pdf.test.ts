import { describe, it, expect } from 'vitest';
import { coverLetterFilename } from '@/lib/cover-letter';
describe('coverLetterFilename', () => {
  it('gera nome seguro para salvar a carta como PDF', () => {
    expect(coverLetterFilename('Acme Tecnologia')).toBe('carta-acme-tecnologia.pdf');
  });

  it('o .txt continua disponível para quem quiser colar o texto', () => {
    expect(coverLetterFilename('Acme Tecnologia', 'txt')).toBe('carta-acme-tecnologia.txt');
  });
});
