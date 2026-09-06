import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Page Directeur : gestion des niveaux/classes de son école.
// Étape 1 de la config école (les Tranches et Tarifs viendront ensuite).
export default async function NiveauxPage() {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const niveaux = await prisma.niveau.findMany({
    where: { ecoleId },
    orderBy: { ordre: "asc" },
  });

  async function ajouterNiveau(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const nom = (formData.get("nom") as string)?.trim();
    const ordre = Number(formData.get("ordre")) || 0;
    if (!nom) return;

    try {
      await prisma.niveau.create({
        data: { nom, ordre, ecoleId },
      });
    } catch {
      // Probablement un niveau du même nom déjà existant pour cette école
      // (contrainte @@unique([ecoleId, nom])). On ignore silencieusement
      // pour l'instant — on affinera le message d'erreur plus tard.
    }

    redirect("/directeur/niveaux");
  }

  async function supprimerNiveau(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const id = formData.get("id") as string;

    // Sécurité : on vérifie que le niveau appartient bien à l'école
    // du directeur connecté avant de le supprimer.
    const niveau = await prisma.niveau.findUnique({ where: { id } });
    if (!niveau || niveau.ecoleId !== ecoleId) {
      redirect("/directeur/niveaux");
    }

    try {
      await prisma.niveau.delete({ where: { id } });
    } catch {
      // Le niveau est probablement déjà utilisé par des élèves ou des
      // tarifs (contrainte de clé étrangère) : on ne peut pas le supprimer.
      // On affinera le message d'erreur plus tard.
    }

    redirect("/directeur/niveaux");
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold">Niveaux de l&apos;école</h1>
      <p className="mt-1 text-sm text-gray-600">
        Les classes de ton école (ex : 6ème, Terminale D). Chaque élève sera
        rattaché à l&apos;un de ces niveaux.
      </p>

      <form action={ajouterNiveau} className="mt-6 flex gap-2">
        <input
          name="nom"
          type="text"
          required
          placeholder="Nom du niveau (ex : 6ème)"
          className="flex-1 rounded border px-3 py-2"
        />
        <input
          name="ordre"
          type="number"
          defaultValue={niveaux.length}
          title="Ordre d'affichage"
          className="w-20 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Ajouter
        </button>
      </form>

      <ul className="mt-6 divide-y rounded border bg-white">
        {niveaux.length === 0 && (
          <li className="p-3 text-sm text-gray-500">
            Aucun niveau pour l&apos;instant.
          </li>
        )}
        {niveaux.map((niveau) => (
          <li
            key={niveau.id}
            className="flex items-center justify-between p-3"
          >
            <span>{niveau.nom}</span>
            <form action={supprimerNiveau}>
              <input type="hidden" name="id" value={niveau.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
