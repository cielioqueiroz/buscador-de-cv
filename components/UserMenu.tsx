"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { FiLogOut, FiUser, FiBriefcase, FiSettings } from "react-icons/fi";
import { Avatar } from "@/components/auth/Avatar";
import { clearLocalUserData } from "@/lib/client/local-data";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <div
        aria-hidden
        className="h-9 w-9 animate-pulse rounded-full bg-surface"
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/entrar"
        className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface sm:px-4"
      >
        Entrar
      </Link>
    );
  }

  const identity = session.user.name || session.user.email || "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu de ${identity}`}
        className="rounded-full shadow-accent transition-transform hover:-rotate-3"
      >
        <Avatar
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-panel border border-border bg-surface shadow-float"
        >
          <div className="border-b border-border px-4 py-3 text-sm">
            <div className="truncate font-medium text-foreground">
              {session.user.name || "Sem nome"}
            </div>
            <div className="truncate text-xs text-muted">{session.user.email}</div>
          </div>
          <Link
            href="/perfil"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background"
            onClick={() => setOpen(false)}
          >
            <FiUser aria-hidden /> Meu perfil
          </Link>
          <Link
            href="/candidaturas"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background"
            onClick={() => setOpen(false)}
          >
            <FiBriefcase aria-hidden /> Minhas candidaturas
          </Link>
          <Link
            href="/conta"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background"
            onClick={() => setOpen(false)}
          >
            <FiSettings aria-hidden /> Conta
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-sm text-foreground hover:bg-background"
            onClick={() => {
              clearLocalUserData();
              void signOut({ callbackUrl: "/" });
            }}
          >
            <FiLogOut aria-hidden /> Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
