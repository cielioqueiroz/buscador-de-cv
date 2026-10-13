import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import PgAdapter from "@auth/pg-adapter";
import { pool } from "@/lib/db/client";
import { findUserByEmail, getAccount } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/password";
import { LoginSchema } from "@/lib/auth/signup-schema";
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
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await findUserByEmail(parsed.data.email);
        if (!user?.password_hash) return null;
        const ok = await verifyPassword(parsed.data.password, user.password_hash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id;
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
