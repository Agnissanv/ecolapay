import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Page Directeur : gestion des tranches (échéances de paiement) de son
// école. Étape 2 de la config école (les Tarifs viendront ensuite, en
// croisant ces Tranches avec les Niveaux déjà créés).
export default async function TranchesPage() {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const tranches = await prisma.tranche.findMany({
    where: { ecoleId },
    orderBy: { ordre: "asc" },
  });

  async function ajouterTranche(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const nom = (formData.get("nom") as string)?.trim();
    const ordre = Number(formData.get("ordre")) || 0;
    const dateEcheanceStr = formData.get("dateEcheance") as string;
    const dateEcheance = dateEcheanceStr ? new Date(dateEcheanceStr) : null;
    if (!nom) return;

    try {
      await prisma.tranche.create({
        data: { nom, ordre, ecoleId, dateEcheance },
      });
    } catch {
      // Probablement une tranche du même nom déjà existante pour cette
      // école (contrainte @@unique([ecoleId, nom])). On affinera le
      // message d'erreur plus tard.
    }

    redirect("/directeur/tranches");
  }

  async function supprimerTranche(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const id = formData.get("id") as string;

    const tranche = await prisma.tranche.findUnique({ where: { id } });
    if (!tranche || tranche.ecoleId !== ecoleId) {
      redirect("/directeur/tranches");
    }

    try {
      await prisma.tranche.delete({ where: { id } });
    } catch {
      // La tranche est probablement déjà utilisée par des tarifs ou des
      // paiements (contrainte de clé étrangère) : on ne peut pas la
      // supprimer. On affinera le message d'erreur plus tard.
    }

    redirect("/directeur/tranches");
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold">Tranches de paiement</h1>
      <p className="mt-1 text-sm text-gray-600">
        Les échéances de ton école (ex : Inscription, Trimestre 1). Le
        montant sera défini par niveau à l&apos;étape suivante.
      </p>

      <form action={ajouterTranche} className="mt-6 flex flex-wrap gap-2">
        <input
          name="nom"
          type="text"
          required
          placeholder="Nom (ex : Trimestre 1)"
          className="flex-1 min-w-[180px] rounded border px-3 py-2"
        />
        <input
          name="ordre"
          type="number"
          defaultValue={tranches.length}
          title="Ordre d'affichage"
          className="w-20 rounded border px-3 py-2"
        />
        <input
          name="dateEcheance"
          type="date"
          title="Date d'échéance (optionnel)"
          className="rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Ajouter
        </button>
      </form>

      <ul className="mt-6 divide-y rounded border bg-white">
        {tranches.length === 0 && (
          <li className="p-3 text-sm text-gray-500">
            Aucune tranche pour l&apos;instant.
          </li>
        )}
        {tranches.map((tranche) => (
          <li
            key={tranche.id}
            className="flex items-center justify-between p-3"
          >
            <span>
              {tranche.nom}
              {tranche.dateEcheance && (
                <span className="ml-2 text-sm text-gray-500">
                  échéance :{" "}
                  {tranche.dateEcheance.toLocaleDateString("fr-FR")}
                </span>
              )}
            </span>
            <form action={supprimerTranche}>
              <input type="hidden" name="id" value={tranche.id} />
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
