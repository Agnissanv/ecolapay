import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { EnteteEspace } from "@/components/EnteteEspace";
import { boutonPrimaire, carte, champTexte } from "@/lib/ui";

// Super Admin — création d'une nouvelle école cliente, avec son premier
// compte Directeur. C'est ce qui manquait pour onboarder une vraie école
// sans passer par le script de seed.
export default async function NouvelleEcolePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/connexion");
  }

  async function creerEcole(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      redirect("/connexion");
    }

    const nomEcole = (formData.get("nomEcole") as string)?.trim();
    const adresse = (formData.get("adresse") as string)?.trim() || null;
    const telephone = (formData.get("telephone") as string)?.trim() || null;
    const nomDirecteur = (formData.get("nomDirecteur") as string)?.trim();
    const emailDirecteur = (formData.get("emailDirecteur") as string)?.trim();
    const motDePasseDirecteur = (formData.get("motDePasseDirecteur") as string)?.trim();

    if (!nomEcole || !nomDirecteur || !emailDirecteur || !motDePasseDirecteur) {
      return;
    }

    const ecole = await prisma.ecole.create({
      data: { nom: nomEcole, adresse, telephone },
    });

    const motDePasseHache = await bcrypt.hash(motDePasseDirecteur, 10);
    await prisma.utilisateur.create({
      data: {
        email: emailDirecteur,
        motDePasse: motDePasseHache,
        nom: nomDirecteur,
        role: "DIRECTEUR",
        ecoleId: ecole.id,
      },
    });

    redirect(`/admin/ecoles/${ecole.id}`);
  }

  return (
    <div className="min-h-screen">
      <EnteteEspace role="Super Admin" nomUtilisateur={session.user.name} />

      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-xl font-semibold text-ink">Nouvelle école</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crée l&apos;école et son premier compte Directeur en une fois.
        </p>

        <form action={creerEcole} className={`mt-6 space-y-6 ${carte}`}>
          <div>
            <h2 className="text-sm font-semibold text-ink">École</h2>
            <div className="mt-2 space-y-2">
              <input
                name="nomEcole"
                type="text"
                required
                placeholder="Nom de l'école"
                className={`${champTexte} mt-0`}
              />
              <input
                name="adresse"
                type="text"
                placeholder="Adresse (optionnel)"
                className={`${champTexte} mt-0`}
              />
              <input
                name="telephone"
                type="tel"
                placeholder="Téléphone (optionnel)"
                className={`${champTexte} mt-0`}
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">
              Premier compte Directeur
            </h2>
            <div className="mt-2 space-y-2">
              <input
                name="nomDirecteur"
                type="text"
                required
                placeholder="Nom du directeur"
                className={`${champTexte} mt-0`}
              />
              <input
                name="emailDirecteur"
                type="email"
                required
                placeholder="Email de connexion"
                className={`${champTexte} mt-0`}
              />
              <input
                name="motDePasseDirecteur"
                type="text"
                required
                placeholder="Mot de passe initial"
                className={`${champTexte} mt-0`}
              />
              <p className="text-xs text-gray-500">
                Communique ces identifiants au directeur — il n&apos;y a pas
                encore d&apos;écran pour qu&apos;il change son mot de passe
                lui-même.
              </p>
            </div>
          </div>

          <button type="submit" className={`w-full ${boutonPrimaire}`}>
            Créer l&apos;école
          </button>
        </form>
      </div>
    </div>
  );
}
