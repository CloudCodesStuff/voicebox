import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { db } from "@/server/db";

/**
 * Auth.js v5. Google is the only provider, shop owners already have a Google
 * account, and one fewer password is one fewer support ticket.
 *
 * AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET are read from the
 * environment by Auth.js convention.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,

  session: { strategy: "database" },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    session({ session, user }) {
      // Expose the user id so tRPC can resolve membership without a second
      // lookup keyed on email (emails change; ids don't).
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
