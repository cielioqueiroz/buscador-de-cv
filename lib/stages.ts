/**
 * As etapas que o usuário atravessa entre soltar o currículo e ver as vagas.
 * A UI (LoadingJourney) desenha uma delas por vez; lib/journey.ts as percorre.
 * Módulo à parte para a UI não puxar a jornada (e o Zod) para o bundle inicial.
 */
export type Stage = 'reading' | 'profiling' | 'searching' | 'scoring';

export const STAGES: Stage[] = ['reading', 'profiling', 'searching', 'scoring'];
