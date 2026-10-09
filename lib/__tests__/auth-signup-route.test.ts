import { describe, it, expect, vi, beforeEach } from "vitest";

const { queryMock, rateLimitMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  rateLimitMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  pool: { query: queryMock },
  assertDatabaseUrl: () => "postgres://x",
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: rateLimitMock,
  clientIp: () => "127.0.0.1",
}));

import { POST } from "@/app/api/auth/signup/route";

function request(body: unknown): Request {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  queryMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue(true);
});

describe("POST /api/auth/signup", () => {
  it("cria usuário e devolve 201", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // findUserByEmail -> inexistente
      .mockResolvedValueOnce({
        rows: [
          {
            id: "u1",
            name: "Ana",
            email: "ana@example.com",
            image: null,
            password_hash: "hash",
            provider: "email",
          },
        ],
      });
    const res = await POST(
      request({ name: "Ana", email: "ana@example.com", password: "senha1234" }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.email).toBe("ana@example.com");
  });

  it("devolve 409 quando o e-mail já existe", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "ana@example.com", password_hash: "h" }],
    });
    const res = await POST(
      request({ email: "ana@example.com", password: "senha1234" }),
    );
    expect(res.status).toBe(409);
  });

  it("devolve 400 quando o schema falha", async () => {
    const res = await POST(request({ email: "bad", password: "x" }));
    expect(res.status).toBe(400);
  });

  it("devolve 429 quando o rate-limit de IP estoura", async () => {
    rateLimitMock.mockResolvedValueOnce(false);
    const res = await POST(
      request({ email: "ana@example.com", password: "senha1234" }),
    );
    expect(res.status).toBe(429);
  });

  it("devolve 429 quando o rate-limit por e-mail estoura", async () => {
    rateLimitMock
      .mockResolvedValueOnce(true) // IP OK
      .mockResolvedValueOnce(false); // email estourou
    const res = await POST(
      request({ email: "ana@example.com", password: "senha1234" }),
    );
    expect(res.status).toBe(429);
  });
});
