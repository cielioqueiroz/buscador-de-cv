'use client';
import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiLoader, FiX } from 'react-icons/fi';
import type { CVProfile, Seniority } from '@/lib/providers/types';

const SENIORITIES: { value: Seniority; label: string }[] = [
  { value: 'estagio', label: 'Estágio' },
  { value: 'junior', label: 'Júnior' },
  { value: 'pleno', label: 'Pleno' },
  { value: 'senior', label: 'Sênior' },
  { value: 'lead', label: 'Lead / Liderança' },
];

/** Lista editável em chips: Enter ou vírgula adiciona, o × remove. */
function TagList({
  label,
  hint,
  items,
  onChange,
  max,
  maxLength,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (next: string[]) => void;
  max: number;
  maxLength: number;
}) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const full = items.length >= max;

  function commit(raw: string) {
    const value = raw.replace(/,/g, '').trim();
    setDraft('');
    if (!value || full) return;
    if (!items.some((i) => i.toLocaleLowerCase('pt-BR') === value.toLocaleLowerCase('pt-BR'))) {
      onChange([...items, value]);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-muted">{label}</label>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 py-1 pl-3 pr-1 text-sm">
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              aria-label={`Remover ${item}`}
              className="grid h-6 w-6 place-items-center rounded-md text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              <FiX className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <input
        id={id}
        value={draft}
        maxLength={maxLength}
        disabled={full}
        onChange={(e) => {
          const value = e.target.value;
          if (value.endsWith(',')) commit(value);
          else setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={full ? `Limite de ${max} itens` : 'Digite e tecle Enter'}
        className="field mt-2 w-full rounded-pill border border-border bg-background px-4 py-2 text-sm outline-none disabled:opacity-60"
      />
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

/**
 * Corrige o que a IA entendeu do CV. Salvar descarta o ranking (que foi
 * pontuado contra o perfil anterior); a próxima visita às vagas busca de novo.
 */
export function ProfileEditor({ profile, onDone }: { profile: CVProfile; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(profile.title);
  const [seniority, setSeniority] = useState<Seniority>(profile.seniority);
  const [skills, setSkills] = useState(profile.skills);
  const [areas, setAreas] = useState(profile.areas);
  const [queries, setQueries] = useState(profile.searchQueries);
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const seniorityId = useId();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (queries.length === 0) {
      toast.error('Mantenha pelo menos uma busca.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/perfil/cv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, seniority, skills, areas, searchQueries: queries }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível salvar.');
      toast.success('Perfil atualizado. As vagas serão buscadas de novo com ele.');
      onDone();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <label htmlFor={titleId} className="text-sm font-semibold text-muted">Cargo</label>
          <input
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={160}
            className="field mt-2 w-full rounded-pill border border-border bg-background px-4 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label htmlFor={seniorityId} className="text-sm font-semibold text-muted">Senioridade</label>
          <select
            id={seniorityId}
            value={seniority}
            onChange={(e) => setSeniority(e.target.value as Seniority)}
            className="field mt-2 w-full rounded-pill border border-border bg-background px-4 py-2 text-sm outline-none"
          >
            {SENIORITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <TagList label="Habilidades" hint="Até 60. Pesam na nota de cada vaga." items={skills} onChange={setSkills} max={60} maxLength={100} />
      <TagList label="Áreas de atuação" hint="Até 30." items={areas} onChange={setAreas} max={30} maxLength={100} />
      <TagList
        label="Buscas que usamos para achar suas vagas"
        hint="De 1 a 8. Cada uma vira uma consulta nas fontes de vagas."
        items={queries}
        onChange={setQueries}
        max={8}
        maxLength={120}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <FiLoader className="animate-spin" aria-hidden /> : null}
          Salvar perfil
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="rounded-pill border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
