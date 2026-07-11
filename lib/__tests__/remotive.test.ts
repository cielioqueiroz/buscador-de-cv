import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remotive } from '@/lib/providers/remotive';

const frontend = {
  id: 99, title: 'Senior Frontend Engineer',
  company_name: 'Globex', candidate_required_location: 'Worldwide',
  description: '<p>React role</p>', url: 'https://remotive.com/job/99',
  publication_date: '2026-05-30',
};
const cook = {
  id: 100, title: 'Head Chef',
  company_name: 'Initech', candidate_required_location: 'Remote',
  description: '<p>Kitchen management</p>', url: 'https://remotive.com/job/100',
  publication_date: '2026-05-30',
};

function stub(jobs: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ jobs }) })));
}

beforeEach(() => stub([frontend]));

describe('remotive.search', () => {
  it('normaliza e marca remote=true', async () => {
    const jobs = await remotive.search('frontend', {});
    expect(jobs[0]).toMatchObject({
      title: 'Senior Frontend Engineer', company: 'Globex',
      remote: true, source: 'remotive', applyUrl: 'https://remotive.com/job/99',
    });
    expect(jobs[0].description).not.toContain('<p>');
  });

  // A API do Remotive ignora o `search`: buscar "cozinheiro" devolvia as mesmas
  // vagas de software que buscar "react". Sem filtro nosso, o ranking se enchia
  // de vagas irrelevantes — que ainda consumiam o orçamento de pontuação da IA.
  it('descarta a vaga que não tem nada a ver com a busca', async () => {
    stub([frontend, cook]);
    const jobs = await remotive.search('desenvolvedor frontend react', {});
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Senior Frontend Engineer');
  });

  it('devolve vazio quando nenhuma vaga casa, em vez de despejar o catálogo', async () => {
    stub([frontend, cook]);
    const jobs = await remotive.search('advogado tributarista', {});
    expect(jobs).toEqual([]);
  });

  it('casa mesmo com acento e caixa diferentes', async () => {
    stub([cook]);
    // "Chef" está no título; a busca vem acentuada e em maiúsculas.
    const jobs = await remotive.search('CHEF de cozinha', {});
    expect(jobs).toHaveLength(1);
  });

  it('casa por prefixo de palavra: "front" encontra "Frontend"', async () => {
    stub([frontend]);
    const jobs = await remotive.search('front', {});
    expect(jobs).toHaveLength(1);
  });

  // O bug que fez o filtro quase não filtrar: "end" (de "front-end") casava
  // como substring com "recommend", "backend", "attend" — quase tudo passava.
  it('não casa "end" no meio de outra palavra', async () => {
    stub([{ ...frontend, title: 'Backend Engineer (recommended)' }]);
    const jobs = await remotive.search('end', {});
    expect(jobs).toEqual([]);
  });

  // A descrição cita "React" de passagem em quase toda vaga de software; usá-la
  // como critério deixava passar vagas sem relação nenhuma.
  it('ignora a descrição — só o título decide', async () => {
    stub([{ ...frontend, title: 'Staff Data Engineer', description: 'stack: React, Node' }]);
    const jobs = await remotive.search('react', {});
    expect(jobs).toEqual([]);
  });
});
