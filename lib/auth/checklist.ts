/**
 * Parte pura do painel: roda no navegador, então não pode importar nada do
 * banco (o driver `pg` quebra o bundle do cliente).
 */

export type DashboardStats = {
  applied: number;
  interviews: number;
  offers: number;
  favorites: number;
  profileUpdatedAt: string | null;
};

export type ChecklistItem = {
  id: "cv" | "photo" | "name" | "favorite" | "application";
  label: string;
  done: boolean;
  href: string;
  action: string;
};

/**
 * O que ainda falta para o usuário tirar proveito do app. Cada item aponta
 * para o lugar onde se resolve — a força do perfil é só a fração concluída.
 */
export function profileChecklist(input: {
  hasCV: boolean;
  hasPhoto: boolean;
  hasName: boolean;
  stats: Pick<DashboardStats, "applied" | "interviews" | "offers" | "favorites">;
}): { items: ChecklistItem[]; strength: number } {
  const { stats } = input;
  const items: ChecklistItem[] = [
    { id: "cv", label: "Enviar seu currículo", done: input.hasCV, href: "#trocar-cv", action: "Enviar" },
    { id: "name", label: "Informar seu nome", done: input.hasName, href: "/conta", action: "Editar conta" },
    { id: "photo", label: "Adicionar uma foto", done: input.hasPhoto, href: "/conta", action: "Enviar foto" },
    { id: "favorite", label: "Favoritar uma vaga", done: stats.favorites > 0, href: "/resultados", action: "Ver vagas" },
    {
      id: "application",
      label: "Registrar uma candidatura no tracker",
      done: stats.applied + stats.interviews + stats.offers > 0,
      href: "/resultados",
      action: "Ver vagas",
    },
  ];
  const strength = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { items, strength };
}
