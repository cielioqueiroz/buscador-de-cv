const PALETTE = [
  "var(--accent)",
  "var(--accent-ink)",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#f97316",
];

function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash >>> 0;
}

export function initialsOf(nameOrEmail: string | null | undefined): string {
  const raw = (nameOrEmail ?? "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const token = parts[0];
    const atIndex = token.indexOf("@");
    const stem = atIndex > 0 ? token.slice(0, atIndex) : token;
    return stem.slice(0, 2).toUpperCase() || "?";
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function colorFor(nameOrEmail: string | null | undefined): string {
  const raw = (nameOrEmail ?? "").trim().toLowerCase();
  if (!raw) return PALETTE[0];
  const idx = fnv1a(raw) % PALETTE.length;
  return PALETTE[idx];
}
