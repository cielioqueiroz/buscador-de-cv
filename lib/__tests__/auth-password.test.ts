import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("auth/password", () => {
  it("faz round-trip de hash e verify", async () => {
    const hash = await hashPassword("segredo123");
    expect(hash).not.toBe("segredo123");
    expect(await verifyPassword("segredo123", hash)).toBe(true);
    expect(await verifyPassword("outraSenha", hash)).toBe(false);
  });

  it("retorna false quando o hash é vazio", async () => {
    expect(await verifyPassword("qualquer", null)).toBe(false);
    expect(await verifyPassword("qualquer", "")).toBe(false);
  });

  it("rejeita senha vazia no hash", async () => {
    await expect(hashPassword("")).rejects.toThrow(/vazia/);
  });
});
