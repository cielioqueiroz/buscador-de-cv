import { NextResponse } from "next/server";
import {
  ApiRequestError,
  assertSameOrigin,
  readJson,
} from "@/lib/api/request";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  SignupSchema,
  type SignupInput,
} from "@/lib/auth/signup-schema";
import {
  createUserWithPassword,
  UserAlreadyExistsError,
} from "@/lib/auth/users";

export const runtime = "nodejs";

const MAX_BYTES = 2_000;

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    const ipKey = `signup:ip:${clientIp(req)}`;
    if (!(await checkRateLimit(ipKey, 10, 60 * 60_000))) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde e tente de novo." },
        { status: 429 },
      );
    }

    const body = await readJson<SignupInput>(req, SignupSchema, MAX_BYTES);

    const emailKey = `signup:email:${body.email}`;
    if (!(await checkRateLimit(emailKey, 5, 60 * 60_000))) {
      return NextResponse.json(
        { error: "Muitas tentativas para esse e-mail. Tente mais tarde." },
        { status: 429 },
      );
    }

    const user = await createUserWithPassword(body);
    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof UserAlreadyExistsError) {
      return NextResponse.json(
        { error: "Esse e-mail já tem conta. Faça login." },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      "issues" in error &&
      Array.isArray((error as { issues?: unknown[] }).issues)
    ) {
      const first = (error as { issues: Array<{ message: string }> }).issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }
    console.error("[auth/signup] erro:", error);
    return NextResponse.json(
      { error: "Falha ao criar conta." },
      { status: 500 },
    );
  }
}
