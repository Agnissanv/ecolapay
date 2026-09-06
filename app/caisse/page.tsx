import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnteteEspace } from "@/components/EnteteEspace";
import { carte, champTexte } from "@/lib/ui";

// Caisse Éclair — étape 1 : recherche d'élève. La Caisse tape un nom ou
// prénom et clique sur un résultat pour ouvrir la fiche de paiement.
export default async function CaissePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const { q } = await searchParams;
  const recherche = q?.trim() ?? "";

  const eleves = await prisma.eleve.findMany({
    where: {
      ecoleId,
      ...(recherche
        ? {
            OR: [
              { nom: { contains: recherche, mode: "insensitive" } },
              { prenom: { contains: recherche, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { niveau: true },
    orderBy: [{ niveau: { ordre: "asc" } }, { nom: "asc" }],
  });

  return (
    <div className="min-h-screen">
      <EnteteEspace role="Caisse" nomUtilisateur={session.user.name} />

      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold text-ink">Caisse Éclair</h1>
        <p className="mt-1 text-sm text-gray-500">
          Recherche un élève pour enregistrer un paiement.
        </p>

        <form action="/caisse" method="get" className="mt-6">
          <input
            name="q"
            type="text"
            defaultValue={recherche}
            placeholder="Rechercher par nom ou prénom..."
            className={`${champTexte} mt-0`}
          />
        </form>

        <ul className={`mt-6 divide-y divide-black/5 ${carte} !p-0`}>
          {eleves.length === 0 && (
            <li className="p-4 text-sm text-gray-500">Aucun élève trouvé.</li>
          )}
          {eleves.map((eleve) => (
            <li key={eleve.id}>
              <Link
                href={`/caisse/eleves/${eleve.id}`}
                className="flex items-center justify-between p-4 transition hover:bg-brand-50/40"
              >
                <span className="text-ink">
                  {eleve.prenom} {eleve.nom}
                </span>
                <span className="text-sm text-gray-500">
                  {eleve.niveau.nom}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
