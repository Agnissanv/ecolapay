import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { genererLienCinetPay } from "@/lib/cinetpay";
import { Marque } from "@/components/Marque";
import { boutonAccent, carte } from "@/lib/ui";

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
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <Marque taille="base" />

      <div className={`mt-6 w-full max-w-sm ${carte}`}>
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          {ecole.nom}
        </p>
        <h1 className="mt-1 text-lg font-semibold text-ink">
          {eleve.prenom} {eleve.nom}
        </h1>
        <p className="text-sm text-gray-500">{eleve.niveau.nom}</p>

        {erreur && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Une erreur est survenue lors de la génération du lien de
            paiement. Merci de réessayer, ou de contacter directement
            l&apos;école.
          </p>
        )}

        {!tarif && (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Aucun tarif n&apos;est défini pour cette tranche.
          </p>
        )}

        {tarif && solde <= 0 && (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Cette tranche est déjà réglée. Merci !
          </p>
        )}

        {tarif && solde > 0 && paiementIndisponible && (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Le paiement en ligne n&apos;est pas disponible pour cette école
            pour le moment. Merci de contacter directement l&apos;école pour
            régler cette tranche.
          </p>
        )}

        {tarif && solde > 0 && !paiementIndisponible && (
          <>
            <div className="mt-5 space-y-1.5 rounded-xl bg-brand-50/60 p-4 text-sm">
              <p className="flex justify-between text-gray-600">
                <span>Montant dû ({tranche.nom})</span>
                <span className="font-medium text-ink">
                  {solde.toLocaleString("fr-FR")} FCFA
                </span>
              </p>
              <p className="flex justify-between text-gray-500">
                <span>Frais de confort ({fraisPourcent}%)</span>
                <span>{frais.toLocaleString("fr-FR")} FCFA</span>
              </p>
              <p className="mt-2 flex justify-between border-t border-brand-100 pt-2 text-base font-semibold text-brand-900">
                <span>Total à payer</span>
                <span>{total.toLocaleString("fr-FR")} FCFA</span>
              </p>
            </div>

            <form action={payer} className="mt-5">
              <button type="submit" className={`w-full ${boutonAccent}`}>
                Payer {total.toLocaleString("fr-FR")} FCFA en ligne
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span>Paiement sécurisé via</span>
              <span className="font-medium text-gray-500">Wave</span>
              <span>·</span>
              <span className="font-medium text-gray-500">Orange Money</span>
              <span>·</span>
              <span className="font-medium text-gray-500">MTN Money</span>
              <span>·</span>
              <span className="font-medium text-gray-500">Moov Money</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
