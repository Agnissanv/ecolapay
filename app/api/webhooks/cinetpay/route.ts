import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierTransactionCinetPay } from "@/lib/cinetpay";

// Webhook appelé par CinetPay (notify_url) quand un paiement est terminé
// (réussi ou échoué). Étapes obligatoires côté sécurité :
// 1. Ne jamais faire confiance aux données de la notification elle-même.
// 2. Rappeler l'API officielle CinetPay pour connaître le vrai statut.
// 3. Vérifier que le montant confirmé correspond bien à celui attendu.
// 4. Être idempotent : CinetPay peut renvoyer la même notification plusieurs
//    fois, il ne faut jamais créer deux fois le même Paiement.
export async function POST(request: NextRequest) {
  let cpmTransId: string | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      cpmTransId = body.cpm_trans_id ?? null;
    } else {
      const formData = await request.formData();
      cpmTransId = (formData.get("cpm_trans_id") as string) ?? null;
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!cpmTransId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const transaction = await prisma.transactionPaiement.findUnique({
    where: { transactionId: cpmTransId },
    include: { ecole: true },
  });

  // Transaction inconnue : on répond 200 quand même pour que CinetPay
  // n'insiste pas indéfiniment sur une notification qu'on ne pourra de
  // toute façon jamais rattacher à quoi que ce soit.
  if (!transaction) {
    return NextResponse.json({ ok: true });
  }

  // Idempotence : déjà traitée, on ne refait rien.
  if (transaction.statut !== "EN_ATTENTE") {
    return NextResponse.json({ ok: true });
  }

  if (!transaction.ecole.cinetpayApiKey || !transaction.ecole.cinetpaySiteId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const verification = await verifierTransactionCinetPay({
    apiKey: transaction.ecole.cinetpayApiKey,
    siteId: transaction.ecole.cinetpaySiteId,
    transactionId: transaction.transactionId,
  });

  const montantConfirme =
    verification.statut === "ACCEPTED" &&
    verification.montant === transaction.montantTotal;

  if (!montantConfirme) {
    await prisma.transactionPaiement.update({
      where: { id: transaction.id },
      data: { statut: "ECHEC", confirmeAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const compteSysteme = await prisma.utilisateur.findUnique({
    where: { email: "systeme@ecolapay.com" },
  });
  if (!compteSysteme) {
    // Ne devrait jamais arriver si le seed a été exécuté sur cette base.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  await prisma.$transaction(async (tx) => {
    const paiement = await tx.paiement.create({
      data: {
        eleveId: transaction.eleveId,
        trancheId: transaction.trancheId,
        // Important : on crédite le montant DÛ, pas le montant total payé
        // en ligne. Le frais de confort couvre le coût CinetPay, il ne doit
        // jamais gonfler le montant de scolarité enregistré.
        montant: transaction.montantDu,
        methode: "MOBILE_MONEY",
        enregistreParId: compteSysteme.id,
      },
    });

    await tx.transactionPaiement.update({
      where: { id: transaction.id },
      data: {
        statut: "REUSSI",
        confirmeAt: new Date(),
        paiementId: paiement.id,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
