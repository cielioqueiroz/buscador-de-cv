import { describe, it, expect } from "vitest";
import { initialsOf, colorFor } from "@/lib/auth/initials";

describe("initialsOf", () => {
  it("usa primeira e última palavra do nome", () => {
    expect(initialsOf("Ana Souza")).toBe("AS");
    expect(initialsOf("Maria Clara da Silva")).toBe("MS");
  });

  it("quando só tem uma palavra, usa as duas primeiras letras", () => {
    expect(initialsOf("Ana")).toBe("AN");
  });

  it("quando é só e-mail, usa as duas primeiras letras antes do @", () => {
    expect(initialsOf("ciélio@example.com")).toBe("CI");
  });

  it("fallback para '?' quando vazio ou nulo", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(null)).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("colorFor", () => {
  it("é determinístico — mesmo nome, mesma cor", () => {
    expect(colorFor("Ana Souza")).toBe(colorFor("Ana Souza"));
  });

  it("ignora diferenças de caixa e espaços nas pontas", () => {
    expect(colorFor("Ana Souza")).toBe(colorFor("  ANA souza "));
  });

  it("retorna cor válida da paleta para entrada vazia", () => {
    expect(typeof colorFor(null)).toBe("string");
    expect(colorFor("")).toBeTruthy();
  });
});
