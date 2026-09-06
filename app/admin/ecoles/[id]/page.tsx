import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

// Super Admin — fiche d'une école : infos de base, comptes rattachés, et
// surtout le contrôle du paiement en ligne (activation + pourcentage de
// frais de confort), qui reste entièrement piloté par EcolaPay et non par
// l'école elle-même.
export default async function FicheEcolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/connexion");
  }

  const { id } = await params;

  const ecole = await prisma.ecole.findUnique({
    where: { id },
    include: { utilisateurs: true, _count: { select: { eleves: true } } },
  });
  if (!ecole) {
    notFound();
  }

  async function mettreAJourPaiement(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      redirect("/connexion");
    }

    const paiementEnLigneActif = formData.get("paiementEnLigneActif") === "on";
    const fraisTexte = (formData.get("fraisConfortPourcent") as string)?.trim();
    const fraisConfortPourcent =
      fraisTexte === "" || fraisTexte === undefined ? null : Number(fraisTexte);

    await prisma.ecole.update({
      where: { id },
      data: { paiementEnLigneActif, fraisConfortPourcent },
    });

    redirect(`/admin/ecoles/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/admin" className="text-sm text-blue-600 hover:underline">
        ← Retour aux écoles
      </Link>

      <h1 className="mt-2 text-xl font-semibold">{ecole.nom}</h1>
      <p className="text-sm text-gray-600">
        {ecole.adresse ?? "Adresse non renseignée"}
        {ecole.telephone ? ` — ${ecole.telephone}` : ""}
      </p>
      <p className="mt-1 text-sm text-gray-600">
        {ecole._count.eleves} élève(s)
      </p>

      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        Comptes rattachés
      </h2>
      <ul className="mt-2 divide-y rounded border bg-white text-sm">
        {ecole.utilisateurs.length === 0 && (
          <li className="p-3 text-gray-500">Aucun compte pour l&apos;instant.</li>
        )}
        {ecole.utilisateurs.map((u) => (
          <li key={u.id} className="flex justify-between p-3">
            <span>{u.nom}</span>
            <span className="text-gray-500">
              {u.email} — {u.role}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm font-semibold text-gray-700">
        Paiement en ligne (CinetPay)
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Clé API : {ecole.cinetpayApiKey ? "renseignée" : "non renseignée"} —
        Site ID : {ecole.cinetpaySiteId ?? "non renseigné"}. Ces identifiants
        sont saisis par l&apos;école elle-même dans son espace Directeur.
      </p>

      <form
        action={mettreAJourPaiement}
        className="mt-3 space-y-3 rounded border bg-white p-4"
      >
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="paiementEnLigneActif"
            defaultChecked={ecole.paiementEnLigneActif}
          />
          <span className="text-sm font-medium">
            Autoriser le paiement en ligne pour cette école
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium">
            Frais de confort (%) répercuté au parent
          </label>
          <input
            name="fraisConfortPourcent"
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={ecole.fraisConfortPourcent ?? ""}
            placeholder="Ex : 2"
            className="mt-1 w-32 rounded border px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Contrôlé uniquement ici, pas par l&apos;école — couvre le frais
            réel prélevé par CinetPay sur cette école.
          </p>
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
