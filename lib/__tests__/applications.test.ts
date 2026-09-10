import { beforeEach, describe, expect, it } from 'vitest';
import { getApplication, listApplications, saveApplication, updateApplicationStage } from '@/lib/applications';

const ranked = {
  job: {
    id: 'vaga-1', title: 'Desenvolvedor', company: 'Empresa', location: 'São Paulo', remote: true,
    description: 'Uma descrição de vaga longa o suficiente.', source: 'adzuna' as const,
    applyUrl: 'https://example.com/vaga',
  },
  match: { jobId: 'vaga-1', score: 88, reasons: ['React combina'], gaps: [] },
};

beforeEach(() => localStorage.clear());

describe('application tracker', () => {
  it('salva uma vaga em Aplicado e preserva a etapa ao atualizar', () => {
    saveApplication(ranked);
    expect(getApplication('vaga-1')?.stage).toBe('aplicado');

    updateApplicationStage('vaga-1', 'entrevista');
    expect(listApplications()[0].stage).toBe('entrevista');
  });

  it('não duplica a mesma vaga ao salvar novamente', () => {
    saveApplication(ranked);
    saveApplication(ranked);
    expect(listApplications()).toHaveLength(1);
  });
});
