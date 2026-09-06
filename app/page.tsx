import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Page d'accueil "routeur" : redirige chaque utilisateur connecté vers son
// espace selon son rôle. Pas connecté → page de connexion.
export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/admin");
    case "DIRECTEUR":
      redirect("/directeur");
    case "CAISSE":
      redirect("/caisse");
    default:
      redirect("/connexion");
  }
}
