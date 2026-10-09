import { describe, it, expect } from "vitest";
import { SignupSchema, LoginSchema } from "@/lib/auth/signup-schema";

describe("SignupSchema", () => {
  it("aceita entrada válida e normaliza e-mail", () => {
    const parsed = SignupSchema.parse({
      name: "  Ana  ",
      email: "  Ana@Example.COM ",
      password: "senha1234",
    });
    expect(parsed.name).toBe("Ana");
    expect(parsed.email).toBe("ana@example.com");
    expect(parsed.password).toBe("senha1234");
  });

  it("rejeita senha curta", () => {
    expect(() =>
      SignupSchema.parse({ email: "a@b.co", password: "curta1" }),
    ).toThrow(/8 caracteres/);
  });

  it("rejeita senha sem número", () => {
    expect(() =>
      SignupSchema.parse({ email: "a@b.co", password: "soletras" }),
    ).toThrow(/número/);
  });

  it("rejeita senha sem letra", () => {
    expect(() =>
      SignupSchema.parse({ email: "a@b.co", password: "12345678" }),
    ).toThrow(/letra/);
  });

  it("rejeita e-mail inválido", () => {
    expect(() =>
      SignupSchema.parse({ email: "nao-eh-email", password: "senha1234" }),
    ).toThrow();
  });
});

describe("LoginSchema", () => {
  it("aceita senhas de 1 caractere (login não valida regra do signup)", () => {
    const parsed = LoginSchema.parse({ email: "x@y.co", password: "a" });
    expect(parsed.password).toBe("a");
  });
});
