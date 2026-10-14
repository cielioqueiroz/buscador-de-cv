import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import PgAdapter from "@auth/pg-adapter";
import { pool } from "@/lib/db/client";
import { getAccount } from "@/lib/auth/users";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { guardToken } from "@/lib/auth/session-guard";
import { isGoogleEnabled } from "@/lib/auth/features";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PgAdapter(pool),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/entrar" },
  providers: [
    ...(isGoogleEnabled()
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: (credentials, request) => authorizeCredentials(credentials, request),
    }),
  ],
  callbacks: {
    async jwt({ token: current, user, trigger }) {
      if (user?.id) current.sub = user.id;
      // Senha trocada depois do login ou conta excluída: null encerra a sessão.
      const token = await guardToken(current, Boolean(user));
      if (!token) return null;
      // `update()` no cliente só sinaliza "mudou algo"; o que entra no token
      // vem do banco, nunca do payload do navegador.
      if (trigger === "update" && token.sub) {
        const account = await getAccount(token.sub);
        if (account) {
          token.name = account.name;
          token.email = account.email;
          token.picture = account.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
