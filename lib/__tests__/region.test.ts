import { describe, it, expect } from 'vitest';
import { regionToOpts } from '@/lib/region';

describe('regionToOpts', () => {
  it('sem região salva busca em qualquer lugar', () => {
    expect(regionToOpts(null)).toEqual({});
    expect(regionToOpts({ escopo: 'any', uf: 'SP', cidade: 'Campinas', pais: 'us' })).toEqual({});
  });

  it('Brasil: cidade com UF, só UF, ou o país inteiro', () => {
    expect(regionToOpts({ escopo: 'br', uf: 'GO', cidade: ' Goiânia ', pais: 'us' }))
      .toEqual({ country: 'br', location: 'Goiânia, GO' });
    expect(regionToOpts({ escopo: 'br', uf: 'PA', cidade: '', pais: 'us' })).toEqual({ country: 'br', location: 'PA' });
    expect(regionToOpts({ escopo: 'br', uf: '', cidade: '', pais: 'us' })).toEqual({ country: 'br', location: undefined });
  });

  it('internacional usa o país escolhido', () => {
    expect(regionToOpts({ escopo: 'intl', uf: '', cidade: 'Lisboa', pais: 'pt' })).toEqual({ country: 'pt', location: 'Lisboa' });
  });
});
