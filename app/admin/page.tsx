import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-semibold">Super Admin — Écoles</h1>
      <p className="mt-1 text-sm text-gray-600">
        Vue d&apos;ensemble de toutes les écoles clientes de la plateforme.
      </p>

      <div className="mt-6">
        <Link
          href="/admin/ecoles/nouvelle"
          className="inline-block rounded bg-black px-4 py-2 text-sm text-white"
        >
          + Nouvelle école
        </Link>
      </div>

      <ul className="mt-6 divide-y rounded border bg-white">
        {ecoles.length === 0 && (
          <li className="p-3 text-sm text-gray-500">
            Aucune école pour l&apos;instant.
          </li>
        )}
        {ecoles.map((ecole) => (
          <li key={ecole.id}>
            <Link
              href={`/admin/ecoles/${ecole.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{ecole.nom}</div>
                <div className="text-sm text-gray-500">
                  {ecole._count.eleves} élève(s) — {ecole._count.utilisateurs}{" "}
                  compte(s)
                </div>
              </div>
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
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
  );
}
