"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

type Props = {
  googleEnabled?: boolean;
  passwordResetEnabled?: boolean;
};

/**
 * Erros que o Auth.js devolve em /entrar?error=... depois de um login com
 * Google que não deu certo. Sem isso o usuário voltava à tela sem explicação.
 */
function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "OAuthAccountNotLinked") {
    return "Esse e-mail já tem uma conta com senha. Entre com e-mail e senha.";
  }
  if (code === "CredentialsSignin") return null;
  return "Não deu para entrar com o Google. Tente de novo.";
}

export function LoginForm({ googleEnabled = true, passwordResetEnabled = true }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/perfil";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => oauthErrorMessage(params.get("error")));
  const [busy, setBusy] = useState<"credentials" | "google" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("credentials");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setBusy(null);
    if (!result || result.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push(result.url || callbackUrl);
    router.refresh();
  }

  async function onGoogle() {
    setBusy("google");
    await signIn("google", { callbackUrl });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {googleEnabled ? (
        <>
          <button
            type="button"
            onClick={onGoogle}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-surface-2 disabled:opacity-60"
          >
            {busy === "google" ? (
              <FiLoader className="animate-spin" aria-hidden />
            ) : (
              <FcGoogle className="h-[18px] w-[18px]" aria-hidden />
            )}
            Entrar com Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            ou com e-mail
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block text-muted">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-pill border border-border bg-background px-4 py-2 field outline-none"
        />
      </label>
      <label className="block text-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted">Senha</span>
          {passwordResetEnabled ? (
            <Link
              href="/esqueci-senha"
              className="text-xs text-accent-ink underline-offset-2 hover:underline"
            >
              Esqueci minha senha
            </Link>
          ) : null}
        </div>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-pill border border-border bg-background px-4 py-2 field outline-none"
        />
      </label>
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-pill bg-background px-3 py-2 text-sm text-foreground"
        >
          <FiAlertCircle aria-hidden /> {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy === "credentials" ? <FiLoader className="animate-spin" aria-hidden /> : null}
        Entrar
      </button>
    </form>
  );
}
