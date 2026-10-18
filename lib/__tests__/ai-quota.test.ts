import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/jobs/rank-search', async () => {
  const real = await vi.importActual<typeof import('@/lib/jobs/rank-search')>('@/lib/jobs/rank-search');
  return { ...real, rankLatestSearch: vi.fn(async () => ({ ranked: [], newIds: [] })) };
});
vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'conta-cota-rota' } })) }));
vi.mock('@/lib/db/client', () => ({
  pool: { query: vi.fn(async () => ({ rows: [{}], rowCount: 1 })) },
  assertDatabaseUrl: () => 'x',
}));

import {
  AI_DAILY_QUOTA,
  aiQuotaExceeded,
  saoPauloDay,
  secondsUntilSaoPauloMidnight,
} from '@/lib/api/ai-quota';
import { rankLatestSearch } from '@/lib/jobs/rank-search';
import { POST as matchPOST } from '@/app/api/jobs/match/route';

// 15h em Brasília (18h UTC): faltam 9 h para a meia-noite.
const TARDE = new Date('2026-10-18T18:00:00Z');

describe('dia de Brasília', () => {
  it('a data vira à meia-noite de Brasília, não à de UTC', () => {
    expect(saoPauloDay(new Date('2026-10-19T02:30:00Z'))).toBe('2026-10-18'); // 23h30 em Brasília
    expect(saoPauloDay(new Date('2026-10-19T03:30:00Z'))).toBe('2026-10-19'); // 00h30
  });

  it('conta os segundos até a meia-noite', () => {
    expect(secondsUntilSaoPauloMidnight(TARDE)).toBe(9 * 3600);
  });
});

describe('aiQuotaExceeded', () => {
  it('libera até o limite do dia e barra o seguinte com mensagem clara e Retry-After', async () => {
    const limite = AI_DAILY_QUOTA.report;
    for (let i = 0; i < limite; i++) {
      expect(await aiQuotaExceeded('conta-a', 'report', TARDE)).toBeNull();
    }
    const barrado = await aiQuotaExceeded('conta-a', 'report', TARDE);
    expect(barrado?.status).toBe(429);
    expect(barrado?.headers.get('Retry-After')).toBe(String(9 * 3600));
    const { error } = await barrado!.json();
    expect(error).toBe(
      `Você chegou ao limite de hoje: ${limite} relatórios do currículo por dia. O limite renova à meia-noite (horário de Brasília).`,
    );
  });

  it('cada conta, cada ação e cada dia têm a sua cota', async () => {
    for (let i = 0; i < AI_DAILY_QUOTA.report; i++) await aiQuotaExceeded('conta-b', 'report', TARDE);
    expect(await aiQuotaExceeded('conta-b', 'report', TARDE)).not.toBeNull();

    expect(await aiQuotaExceeded('conta-c', 'report', TARDE)).toBeNull(); // outra conta
    expect(await aiQuotaExceeded('conta-b', 'letter', TARDE)).toBeNull(); // outra ação
    expect(await aiQuotaExceeded('conta-b', 'report', new Date('2026-10-19T12:00:00Z'))).toBeNull(); // dia seguinte
  });

  it('os números combinados com o dono', () => {
    expect(AI_DAILY_QUOTA).toEqual({ analyze: 10, match: 30, letter: 20, adapt: 20, report: 5 });
  });
});

describe('rota /api/jobs/match com a cota esgotada', () => {
  it('responde 429 com a mensagem da cota e não chama a IA', async () => {
    const hoje = new Date();
    for (let i = 0; i < AI_DAILY_QUOTA.match; i++) await aiQuotaExceeded('conta-cota-rota', 'match', hoje);
    vi.mocked(rankLatestSearch).mockClear();

    const res = await matchPOST(new Request('http://x/api/jobs/match', {
      method: 'POST',
      headers: { 'x-forwarded-for': '9.9.9.9' },
      body: '{}',
    }));

    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/limite de hoje: 30 buscas de vagas/);
    expect(rankLatestSearch).not.toHaveBeenCalled();
  });
});
