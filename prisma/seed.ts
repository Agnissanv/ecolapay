// Script de "seed" : crée un compte Super Admin (aucune école, supervise
// toute la plateforme), une école de test avec un compte Directeur et un
// compte Caisse, pour pouvoir tester la connexion avant d'avoir une vraie
// interface d'administration complète.
//
// Lancer avec : npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const motDePasseAdmin = await bcrypt.hash("admin123", 10);
  const admin = await prisma.utilisateur.upsert({
    where: { email: "admin@ecolapay.com" },
    update: {},
    create: {
      email: "admin@ecolapay.com",
      motDePasse: motDePasseAdmin,
      nom: "Super Admin EcolaPay",
      role: "SUPER_ADMIN",
      ecoleId: null,
    },
  });

  // Compte technique unique, jamais utilisé pour se connecter (mot de passe
  // aléatoire jeté) : sert uniquement de "enregistreParId" pour les
  // paiements en ligne confirmés automatiquement par le webhook CinetPay.
  const motDePasseSysteme = await bcrypt.hash(crypto.randomUUID(), 10);
  await prisma.utilisateur.upsert({
    where: { email: "systeme@ecolapay.com" },
    update: {},
    create: {
      email: "systeme@ecolapay.com",
      motDePasse: motDePasseSysteme,
      nom: "Système EcolaPay (paiements en ligne automatiques)",
      role: "SYSTEME",
      ecoleId: null,
    },
  });

  const ecole = await prisma.ecole.upsert({
    where: { id: "ecole-test" },
    update: {},
    create: {
      id: "ecole-test",
      nom: "École Test",
      adresse: "Abidjan",
    },
  });

  const motDePasseDirecteur = await bcrypt.hash("directeur123", 10);
  const motDePasseCaisse = await bcrypt.hash("caisse123", 10);

  const directeur = await prisma.utilisateur.upsert({
    where: { email: "directeur@ecolatest.com" },
    update: {},
    create: {
      email: "directeur@ecolatest.com",
      motDePasse: motDePasseDirecteur,
      nom: "Directeur Test",
      role: "DIRECTEUR",
      ecoleId: ecole.id,
    },
  });

  const caisse = await prisma.utilisateur.upsert({
    where: { email: "caisse@ecolatest.com" },
    update: {},
    create: {
      email: "caisse@ecolatest.com",
      motDePasse: motDePasseCaisse,
      nom: "Caisse Test",
      role: "CAISSE",
      ecoleId: ecole.id,
    },
  });

  console.log("Seed terminé :");
  console.log("Super Admin :", admin.email, "/ mot de passe : admin123");
  console.log("École :", ecole.nom);
  console.log("Directeur :", directeur.email, "/ mot de passe : directeur123");
  console.log("Caisse    :", caisse.email, "/ mot de passe : caisse123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
