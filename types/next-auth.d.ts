import { DefaultSession } from "next-auth";

// Étend les types NextAuth pour transporter l'id, le rôle et l'école de
// l'utilisateur dans le token et la session (par défaut, NextAuth ne connaît
// que nom / email / image). ecoleId est nul pour un compte SUPER_ADMIN, qui
// n'est rattaché à aucune école en particulier.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      ecoleId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    ecoleId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    ecoleId?: string | null;
  }
}
