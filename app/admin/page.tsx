import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnteteEspace } from "@/components/EnteteEspace";
import { boutonPrimaire, carte } from "@/lib/ui";

// Super Admin — vue d'ensemble de toutes les écoles de la plateforme.
export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/connexion");
  }

  const ecoles = await prisma.ecole.findMany({
    include: { _count: { select: { eleves: true, utilisateurs: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen">
      <EnteteEspace role="Super Admin" nomUtilisateur={session.user.name} />

      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-xl font-semibold text-ink">Écoles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d&apos;ensemble de toutes les écoles clientes de la plateforme.
        </p>

        <div className="mt-6">
          <Link href="/admin/ecoles/nouvelle" className={boutonPrimaire}>
            + Nouvelle école
          </Link>
        </div>

        <ul className={`mt-6 divide-y divide-black/5 ${carte} !p-0`}>
          {ecoles.length === 0 && (
            <li className="p-4 text-sm text-gray-500">
              Aucune école pour l&apos;instant.
            </li>
          )}
          {ecoles.map((ecole) => (
            <li key={ecole.id}>
              <Link
                href={`/admin/ecoles/${ecole.id}`}
                className="flex items-center justify-between p-4 transition hover:bg-brand-50/40"
              >
                <div>
                  <div className="font-medium text-ink">{ecole.nom}</div>
                  <div className="text-sm text-gray-500">
                    {ecole._count.eleves} élève(s) — {ecole._count.utilisateurs}{" "}
                    compte(s)
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    ecole.paiementEnLigneActif
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ecole.paiementEnLigneActif
                    ? "Paiement en ligne actif"
                    : "Paiement en ligne inactif"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
