import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

// Caisse Éclair — étape 2 : fiche élève. Affiche le solde par tranche et
// permet d'enregistrer un nouveau paiement.
export default async function FicheElevePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const { id } = await params;

  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: { niveau: true, ecole: true },
  });

  if (!eleve || eleve.ecoleId !== ecoleId) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocole = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocole}://${host}`;
  const paiementEnLigneDisponible =
    eleve.ecole.paiementEnLigneActif &&
    !!eleve.ecole.cinetpayApiKey &&
    !!eleve.ecole.cinetpaySiteId;

  const [tarifs, paiements] = await Promise.all([
    prisma.tarifTranche.findMany({
      where: { niveauId: eleve.niveauId },
      include: { tranche: true },
      orderBy: { tranche: { ordre: "asc" } },
    }),
    prisma.paiement.findMany({ where: { eleveId: eleve.id } }),
  ]);

  const payeParTranche = new Map<string, number>();
  for (const paiement of paiements) {
    payeParTranche.set(
      paiement.trancheId,
      (payeParTranche.get(paiement.trancheId) ?? 0) + paiement.montant
    );
  }

  async function enregistrerPaiement(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId || !session.user.id) {
      redirect("/connexion");
    }
    const ecoleId = session.user.ecoleId;
    const enregistreParId = session.user.id;

    const eleveId = formData.get("eleveId") as string;
    const trancheId = formData.get("trancheId") as string;
    const montant = Number(formData.get("montant"));
    const methode = formData.get("methode") as string;

    if (!eleveId || !trancheId || !montant || montant <= 0) return;
    if (methode !== "ESPECES" && methode !== "MOBILE_MONEY") return;

    // Sécurité : l'élève et la tranche doivent appartenir à l'école du
    // caissier connecté.
    const [eleveVerif, trancheVerif] = await Promise.all([
      prisma.eleve.findUnique({ where: { id: eleveId } }),
      prisma.tranche.findUnique({ where: { id: trancheId } }),
    ]);
    if (!eleveVerif || eleveVerif.ecoleId !== ecoleId) return;
    if (!trancheVerif || trancheVerif.ecoleId !== ecoleId) return;

    await prisma.paiement.create({
      data: {
        eleveId,
        trancheId,
        montant,
        methode,
        enregistreParId,
      },
    });

    redirect(`/caisse/eleves/${eleveId}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/caisse" className="text-sm text-blue-600 hover:underline">
        ← Retour à la recherche
      </Link>

      <h1 className="mt-2 text-xl font-semibold">
        {eleve.prenom} {eleve.nom}
      </h1>
      <p className="text-sm text-gray-600">
        {eleve.niveau.nom} — Parent : {eleve.parentNom} (
        {eleve.parentTelephone})
      </p>

      <table className="mt-6 w-full rounded border bg-white text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left">Tranche</th>
            <th className="p-2 text-right">Dû</th>
            <th className="p-2 text-right">Payé</th>
            <th className="p-2 text-right">Solde</th>
            {paiementEnLigneDisponible && (
              <th className="p-2 text-left">Paiement en ligne</th>
            )}
          </tr>
        </thead>
        <tbody>
          {tarifs.length === 0 && (
            <tr>
              <td colSpan={5} className="p-3 text-center text-gray-500">
                Aucun tarif défini pour ce niveau.
              </td>
            </tr>
          )}
          {tarifs.map((tarif) => {
            const paye = payeParTranche.get(tarif.trancheId) ?? 0;
            const solde = tarif.montant - paye;
            const lienPaiement = `${baseUrl}/paiement/${eleve.id}/${tarif.trancheId}`;
            const messageWhatsapp = encodeURIComponent(
              `Bonjour ${eleve.parentNom}, voici le lien pour régler en ligne la tranche "${tarif.tranche.nom}" de ${eleve.prenom} ${eleve.nom} : ${lienPaiement}`
            );
            const numeroWhatsapp = eleve.parentTelephone.replace(/[^\d]/g, "");
            return (
              <tr key={tarif.id} className="border-b">
                <td className="p-2">{tarif.tranche.nom}</td>
                <td className="p-2 text-right">
                  {tarif.montant.toLocaleString("fr-FR")}
                </td>
                <td className="p-2 text-right">
                  {paye.toLocaleString("fr-FR")}
                </td>
                <td
                  className={`p-2 text-right font-medium ${
                    solde > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {solde.toLocaleString("fr-FR")}
                </td>
                {paiementEnLigneDisponible && (
                  <td className="p-2">
                    {solde > 0 ? (
                      <div className="flex flex-col gap-1 text-xs">
                        <a
                          href={lienPaiement}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Ouvrir le lien
                        </a>
                        <a
                          href={`https://wa.me/${numeroWhatsapp}?text=${messageWhatsapp}`}
                          target="_blank"
                          className="text-green-600 hover:underline"
                        >
                          Envoyer sur WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {tarifs.length > 0 && (
        <form
          action={enregistrerPaiement}
          className="mt-6 flex flex-wrap items-end gap-3 rounded border bg-white p-4"
        >
          <input type="hidden" name="eleveId" value={eleve.id} />

          <div>
            <label className="block text-sm font-medium">Tranche</label>
            <select
              name="trancheId"
              required
              className="mt-1 rounded border px-3 py-2"
            >
              {tarifs.map((tarif) => (
                <option key={tarif.trancheId} value={tarif.trancheId}>
                  {tarif.tranche.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Montant (FCFA)
            </label>
            <input
              name="montant"
              type="number"
              min={1}
              required
              className="mt-1 w-32 rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Méthode</label>
            <select
              name="methode"
              required
              className="mt-1 rounded border px-3 py-2"
            >
              <option value="ESPECES">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Enregistrer le paiement
          </button>
        </form>
      )}
    </div>
  );
}
