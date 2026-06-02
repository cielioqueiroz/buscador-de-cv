import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remotive } from '@/lib/providers/remotive';

const fake = {
  jobs: [{
    id: 99, title: 'Senior Frontend Engineer',
    company_name: 'Globex', candidate_required_location: 'Worldwide',
    description: '<p>React role</p>', url: 'https://remotive.com/job/99',
    publication_date: '2026-05-30',
  }],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => fake })));
});

describe('remotive.search', () => {
  it('normaliza e marca remote=true', async () => {
    const jobs = await remotive.search('frontend', {});
    expect(jobs[0]).toMatchObject({
      title: 'Senior Frontend Engineer', company: 'Globex',
      remote: true, source: 'remotive', applyUrl: 'https://remotive.com/job/99',
    });
    expect(jobs[0].description).not.toContain('<p>');
  });
});
