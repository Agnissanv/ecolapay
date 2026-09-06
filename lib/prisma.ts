import { PrismaClient } from "@prisma/client";

// Évite de créer une nouvelle instance de PrismaClient à chaque rechargement
// à chaud en développement (Next.js recharge les modules très souvent).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
