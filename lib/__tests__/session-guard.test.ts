import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({ pool: { query: vi.fn() } }));

import { pool } from "@/lib/db/client";
import { guardToken, loadSessionState, RECHECK_MS, touchLastSeen } from "@/lib/auth/session-guard";

const NOW = 1_800_000_000_000;

describe("guardToken", () => {
  it("no login carimba authAt e checkedAt sem ir ao banco", async () => {
    const load = vi.fn();
    const token = await guardToken({ sub: "u1" }, true, NOW, load);
    expect(token).toMatchObject({ sub: "u1", authAt: NOW, checkedAt: NOW });
    expect(load).not.toHaveBeenCalled();
  });

  it("dentro da janela de revalidação não consulta o banco", async () => {
    const load = vi.fn();
    const token = { sub: "u1", authAt: NOW - 1000, checkedAt: NOW - 1000 };
    expect(await guardToken(token, false, NOW, load)).toBe(token);
    expect(load).not.toHaveBeenCalled();
  });

  it("encerra a sessão quando a conta não existe mais", async () => {
    const load = vi.fn().mockResolvedValue(null);
    const token = { sub: "u1", authAt: NOW - RECHECK_MS * 2, checkedAt: NOW - RECHECK_MS * 2 };
    expect(await guardToken(token, false, NOW, load)).toBeNull();
  });

  it("encerra a sessão aberta antes da troca de senha", async () => {
    const load = vi.fn().mockResolvedValue({ passwordChangedAt: new Date(NOW - 60_000) });
    const token = { sub: "u1", authAt: NOW - 3_600_000, checkedAt: NOW - RECHECK_MS - 1 };
    expect(await guardToken(token, false, NOW, load)).toBeNull();
  });

  it("mantém a sessão aberta depois da troca e renova o checkedAt", async () => {
    const load = vi.fn().mockResolvedValue({ passwordChangedAt: new Date(NOW - 3_600_000) });
    const token = { sub: "u1", authAt: NOW - 60_000, checkedAt: NOW - RECHECK_MS - 1 };
    expect(await guardToken(token, false, NOW, load)).toMatchObject({ authAt: NOW - 60_000, checkedAt: NOW });
  });

  it("token antigo sem authAt usa o iat", async () => {
    const load = vi.fn().mockResolvedValue({ passwordChangedAt: new Date(NOW - 60_000) });
    const antes = { sub: "u1", iat: (NOW - 3_600_000) / 1000 };
    const depois = { sub: "u1", iat: (NOW - 1_000) / 1000 };
    expect(await guardToken(antes, false, NOW, load)).toBeNull();
    expect(await guardToken(depois, false, NOW, load)).toMatchObject({ authAt: NOW - 1_000 });
  });
});

describe("last_seen_at (contas inativas)", () => {
  const query = vi.mocked(pool.query);

  it("a rechecagem da sessão carimba o uso no máximo uma vez por dia", async () => {
    query.mockResolvedValueOnce({ rows: [{ password_changed_at: null }] } as never);
    expect(await loadSessionState("u1")).toEqual({ passwordChangedAt: null });
    const [sql, params] = query.mock.calls.at(-1)!;
    expect(sql).toMatch(/update users set last_seen_at = now\(\)/);
    expect(sql).toContain("last_seen_at < now() - interval '1 day'");
    expect(params).toEqual(["u1"]);
  });

  it("conta excluída continua derrubando a sessão", async () => {
    query.mockResolvedValueOnce({ rows: [] } as never);
    expect(await loadSessionState("u1")).toBeNull();
  });

  it("o login carimba o uso na hora", async () => {
    query.mockResolvedValueOnce({ rows: [] } as never);
    await touchLastSeen("u1");
    expect(query.mock.calls.at(-1)).toEqual(["update users set last_seen_at = now() where id = $1", ["u1"]]);
  });
});
