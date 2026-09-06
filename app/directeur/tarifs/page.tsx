import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnteteEspace } from "@/components/EnteteEspace";
import { boutonPrimaire, carte, lienDiscret } from "@/lib/ui";

// Page Directeur : grille tarifaire. Pour chaque croisement
// Tranche × Niveau, on définit le montant (en FCFA) à payer.
// Étape 3 de la config école — nécessite que des Niveaux et des
// Tranches existent déjà.
export default async function TarifsPage() {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const [niveaux, tranches, tarifs] = await Promise.all([
    prisma.niveau.findMany({ where: { ecoleId }, orderBy: { ordre: "asc" } }),
    prisma.tranche.findMany({ where: { ecoleId }, orderBy: { ordre: "asc" } }),
    prisma.tarifTranche.findMany({
      where: { niveau: { ecoleId } },
    }),
  ]);

  const montantParCle = new Map<string, number>();
  for (const tarif of tarifs) {
    montantParCle.set(`${tarif.trancheId}__${tarif.niveauId}`, tarif.montant);
  }

  async function enregistrerTarifs(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    // Sécurité : on ne traite que les tranches/niveaux qui appartiennent
    // bien à l'école du directeur connecté.
    const [niveauxValides, tranchesValides] = await Promise.all([
      prisma.niveau.findMany({ where: { ecoleId }, select: { id: true } }),
      prisma.tranche.findMany({ where: { ecoleId }, select: { id: true } }),
    ]);
    const niveauIds = new Set(niveauxValides.map((n) => n.id));
    const trancheIds = new Set(tranchesValides.map((t) => t.id));

    for (const [cle, valeur] of formData.entries()) {
      if (!cle.startsWith("tarif__")) continue;
      const [, trancheId, niveauId] = cle.split("__");
      if (!trancheIds.has(trancheId) || !niveauIds.has(niveauId)) continue;

      const texte = (valeur as string).trim();
      if (texte === "") continue;
      const montant = Number(texte);
      if (Number.isNaN(montant) || montant < 0) continue;

      await prisma.tarifTranche.upsert({
        where: { trancheId_niveauId: { trancheId, niveauId } },
        update: { montant },
        create: { trancheId, niveauId, montant },
      });
    }

    redirect("/directeur/tarifs");
  }

  if (niveaux.length === 0 || tranches.length === 0) {
    return (
      <div className="min-h-screen">
        <EnteteEspace role="Directeur" nomUtilisateur={session.user.name} />
        <div className="mx-auto max-w-2xl p-8">
          <h1 className="text-xl font-semibold text-ink">Grille tarifaire</h1>
          <p className="mt-2 text-sm text-gray-500">
            Il faut d&apos;abord créer au moins un niveau et une tranche avant
            de pouvoir définir les tarifs.
          </p>
          <div className="mt-4 flex gap-4">
            <Link href="/directeur/niveaux" className={lienDiscret}>
              Aller à Niveaux ({niveaux.length})
            </Link>
            <Link href="/directeur/tranches" className={lienDiscret}>
              Aller à Tranches ({tranches.length})
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <EnteteEspace role="Directeur" nomUtilisateur={session.user.name} />

      <div className="mx-auto max-w-4xl p-8">
        <h1 className="text-xl font-semibold text-ink">Grille tarifaire</h1>
        <p className="mt-1 text-sm text-gray-500">
          Le montant (en FCFA) de chaque tranche, par niveau. Laisse vide une
          case pour ne rien enregistrer.
        </p>

        <form action={enregistrerTarifs} className="mt-6">
          <div className={`overflow-x-auto ${carte} !p-0`}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-brand-50/60 text-gray-600">
                  <th className="sticky left-0 bg-brand-50/60 p-3 text-left font-medium">
                    Tranche \ Niveau
                  </th>
                  {niveaux.map((niveau) => (
                    <th
                      key={niveau.id}
                      className="min-w-[110px] p-3 text-left font-medium"
                    >
                      {niveau.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tranches.map((tranche) => (
                  <tr key={tranche.id} className="border-t border-black/5">
                    <td className="sticky left-0 bg-white p-3 font-medium text-ink">
                      {tranche.nom}
                    </td>
                    {niveaux.map((niveau) => (
                      <td key={niveau.id} className="p-2">
                        <input
                          type="number"
                          min={0}
                          name={`tarif__${tranche.id}__${niveau.id}`}
                          defaultValue={
                            montantParCle.get(`${tranche.id}__${niveau.id}`) ??
                            ""
                          }
                          placeholder="—"
                          className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className={`mt-4 ${boutonPrimaire}`}>
            Enregistrer la grille
          </button>
        </form>
      </div>
    </div>
  );
}
