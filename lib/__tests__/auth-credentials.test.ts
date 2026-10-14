import { describe, it, expect, vi, beforeEach } from "vitest";

const { findMock, verifyMock, rateLimitMock } = vi.hoisted(() => ({
  findMock: vi.fn(),
  verifyMock: vi.fn(),
  rateLimitMock: vi.fn(),
}));

// O next-auth puxa `next/server`, que não existe fora do Next; só a classe importa.
vi.mock("next-auth", () => ({ CredentialsSignin: class extends Error {} }));
vi.mock("@/lib/auth/users", () => ({ findUserByEmail: findMock }));
vi.mock("@/lib/auth/password", () => ({ verifyPassword: verifyMock }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: rateLimitMock,
  clientIp: () => "10.0.0.1",
}));

import { authorizeCredentials, TooManyAttemptsError } from "@/lib/auth/credentials";

const req = new Request("http://localhost/api/auth/callback/credentials", { method: "POST" });
const USER = { id: "u1", email: "a@b.com", name: "Ana", image: null, password_hash: "hash" };

beforeEach(() => {
  findMock.mockReset();
  verifyMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe("authorizeCredentials", () => {
  it("devolve o usuário com e-mail e senha certos", async () => {
    findMock.mockResolvedValue(USER);
    verifyMock.mockResolvedValue(true);
    const user = await authorizeCredentials({ email: "A@B.com", password: "x1234567" }, req);
    expect(user).toEqual({ id: "u1", email: "a@b.com", name: "Ana", image: null });
    expect(rateLimitMock).toHaveBeenCalledWith("login:ip:10.0.0.1", 20, 15 * 60_000);
    expect(rateLimitMock).toHaveBeenCalledWith("login:email:a@b.com", 8, 15 * 60_000);
  });

  it("recusa senha errada", async () => {
    findMock.mockResolvedValue(USER);
    verifyMock.mockResolvedValue(false);
    expect(await authorizeCredentials({ email: "a@b.com", password: "errada1" }, req)).toBeNull();
  });

  it("recusa conta só do Google (sem senha)", async () => {
    findMock.mockResolvedValue({ ...USER, password_hash: null });
    expect(await authorizeCredentials({ email: "a@b.com", password: "x1234567" }, req)).toBeNull();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("estoura o limite antes de tocar no banco ou no bcrypt", async () => {
    rateLimitMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(
      authorizeCredentials({ email: "a@b.com", password: "x1234567" }, req),
    ).rejects.toBeInstanceOf(TooManyAttemptsError);
    expect(findMock).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("ignora payload inválido sem gastar o limite", async () => {
    expect(await authorizeCredentials({ email: "nao-e-email", password: "" }, req)).toBeNull();
    expect(rateLimitMock).not.toHaveBeenCalled();
  });
});
