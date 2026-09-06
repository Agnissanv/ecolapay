import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { genererLienCinetPay } from "@/lib/cinetpay";

// Page PUBLIQUE (pas d'authentification) : le parent y arrive via un lien
// WhatsApp envoyé par la Caisse ou le Directeur, voit le montant dû + le
// frais de confort, et paie directement en ligne via CinetPay. L'argent va
// sur le compte de l'école, jamais chez EcolaPay.
export default async function PagePaiementPublique({
  params,
  searchParams,
}: {
  params: Promise<{ eleveId: string; trancheId: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { eleveId, trancheId } = await params;
  const { erreur } = await searchParams;

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: { ecole: true, niveau: true },
  });
  if (!eleve) notFound();

  const tranche = await prisma.tranche.findUnique({ where: { id: trancheId } });
  if (!tranche || tranche.ecoleId !== eleve.ecoleId) notFound();

  const [tarif, paiements] = await Promise.all([
    prisma.tarifTranche.findUnique({
      where: { trancheId_niveauId: { trancheId, niveauId: eleve.niveauId } },
    }),
    prisma.paiement.findMany({ where: { eleveId, trancheId } }),
  ]);

  const ecole = eleve.ecole;
  const montantDu = tarif?.montant ?? 0;
  const dejaPaye = paiements.reduce((somme, p) => somme + p.montant, 0);
  const solde = montantDu - dejaPaye;

  const paiementIndisponible =
    !ecole.paiementEnLigneActif || !ecole.cinetpayApiKey || !ecole.cinetpaySiteId;
  const fraisPourcent = ecole.fraisConfortPourcent ?? 0;
  const frais = solde > 0 ? Math.ceil((solde * fraisPourcent) / 100) : 0;
  const total = solde + frais;

  async function payer() {
    "use server";

    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      include: { ecole: true },
    });
    const tranche = eleve
      ? await prisma.tranche.findUnique({ where: { id: trancheId } })
      : null;

    if (!eleve || !tranche || tranche.ecoleId !== eleve.ecoleId) {
      redirect(`/paiement/${eleveId}/${trancheId}?erreur=1`);
    }

    const ecole = eleve.ecole;
    if (!ecole.paiementEnLigneActif || !ecole.cinetpayApiKey || !ecole.cinetpaySiteId) {
      redirect(`/paiement/${eleveId}/${trancheId}?erreur=1`);
    }

    // On ne fait JAMAIS confiance à un montant venu du navigateur : tout est
    // recalculé ici, côté serveur, à partir des vraies données.
    const [tarif, paiements] = await Promise.all([
      prisma.tarifTranche.findUnique({
        where: { trancheId_niveauId: { trancheId, niveauId: eleve.niveauId } },
      }),
      prisma.paiement.findMany({ where: { eleveId, trancheId } }),
    ]);
    const montantDu = tarif?.montant ?? 0;
    const dejaPaye = paiements.reduce((somme, p) => somme + p.montant, 0);
    const solde = montantDu - dejaPaye;
    if (solde <= 0) {
      redirect(`/paiement/${eleveId}/${trancheId}`);
    }

    const fraisPourcent = ecole.fraisConfortPourcent ?? 0;
    const frais = Math.ceil((solde * fraisPourcent) / 100);
    const total = solde + frais;

    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocole = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocole}://${host}`;

    const transactionId = `ep${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

    await prisma.transactionPaiement.create({
      data: {
        transactionId,
        montantDu: solde,
        montantFrais: frais,
        montantTotal: total,
        ecoleId: ecole.id,
        eleveId: eleve.id,
        trancheId: tranche.id,
      },
    });

    try {
      const { paymentUrl } = await genererLienCinetPay({
        apiKey: ecole.cinetpayApiKey,
        siteId: ecole.cinetpaySiteId,
        transactionId,
        montant: total,
        description: `Scolarité ${tranche.nom} - ${eleve.prenom} ${eleve.nom}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
        returnUrl: `${baseUrl}/paiement/${eleveId}/${trancheId}/merci`,
        customerName: eleve.parentNom,
        customerPhone: eleve.parentTelephone,
      });
      redirect(paymentUrl);
    } catch {
      redirect(`/paiement/${eleveId}/${trancheId}?erreur=1`);
    }
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">Paiement de scolarité</h1>
      <p className="mt-1 text-sm text-gray-600">
        {eleve.prenom} {eleve.nom} — {eleve.niveau.nom}
      </p>
      <p className="text-sm text-gray-500">{ecole.nom}</p>

      {erreur && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Une erreur est survenue lors de la génération du lien de paiement.
          Merci de réessayer, ou de contacter directement l&apos;école.
        </p>
      )}

      {!tarif && (
        <p className="mt-4 rounded border bg-gray-50 p-3 text-sm text-gray-600">
          Aucun tarif n&apos;est défini pour cette tranche.
        </p>
      )}

      {tarif && solde <= 0 && (
        <p className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Cette tranche est déjà réglée. Merci !
        </p>
      )}

      {tarif && solde > 0 && paiementIndisponible && (
        <p className="mt-4 rounded border bg-gray-50 p-3 text-sm text-gray-600">
          Le paiement en ligne n&apos;est pas disponible pour cette école pour
          le moment. Merci de contacter directement l&apos;école pour régler
          cette tranche.
        </p>
      )}

      {tarif && solde > 0 && !paiementIndisponible && (
        <>
          <div className="mt-4 space-y-1 rounded border bg-gray-50 p-3 text-sm">
            <p className="flex justify-between">
              <span>Montant dû ({tranche.nom})</span>
              <span>{solde.toLocaleString("fr-FR")} FCFA</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span>Frais de confort ({fraisPourcent}%)</span>
              <span>{frais.toLocaleString("fr-FR")} FCFA</span>
            </p>
            <p className="mt-1 flex justify-between border-t pt-1 font-semibold">
              <span>Total à payer</span>
              <span>{total.toLocaleString("fr-FR")} FCFA</span>
            </p>
          </div>

          <form action={payer} className="mt-4">
            <button
              type="submit"
              className="w-full rounded bg-black px-4 py-3 text-white"
            >
              Payer {total.toLocaleString("fr-FR")} FCFA en ligne
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-gray-400">
            Paiement sécurisé via CinetPay (Wave, Orange Money, MTN Money,
            Moov Money).
          </p>
        </>
      )}
    </div>
  );
}
