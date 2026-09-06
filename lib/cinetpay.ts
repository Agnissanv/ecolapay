// Petit client pour l'API CHECKOUT de CinetPay (paiement en ligne).
// Doc officielle : https://docs.cinetpay.com/api/1.0-en/checkout/initialisation
//
// Chaque école utilise SA PROPRE clé API et SON PROPRE site_id (voir
// Ecole.cinetpayApiKey / Ecole.cinetpaySiteId) : l'argent va directement
// sur son compte marchand CinetPay, jamais chez EcolaPay.

type ParamsLienPaiement = {
  apiKey: string;
  siteId: string;
  transactionId: string;
  montant: number; // FCFA, entier (CinetPay n'accepte pas les centimes)
  description: string;
  notifyUrl: string;
  returnUrl: string;
  customerName?: string;
  customerPhone?: string;
};

export async function genererLienCinetPay(params: ParamsLienPaiement) {
  const reponse = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: params.apiKey,
      site_id: params.siteId,
      transaction_id: params.transactionId,
      amount: params.montant,
      currency: "XOF",
      description: params.description,
      notify_url: params.notifyUrl,
      return_url: params.returnUrl,
      channels: "ALL",
      customer_name: params.customerName,
      customer_phone_number: params.customerPhone,
    }),
  });

  const resultat = await reponse.json();

  if (resultat.code !== "201" || !resultat.data?.payment_url) {
    throw new Error(
      `Échec de génération du lien CinetPay : ${resultat.message ?? "erreur inconnue"} — ${resultat.description ?? ""}`
    );
  }

  return {
    paymentUrl: resultat.data.payment_url as string,
    paymentToken: resultat.data.payment_token as string,
  };
}

type ParamsVerification = {
  apiKey: string;
  siteId: string;
  transactionId: string;
};

// Vérifie le vrai statut d'une transaction directement auprès de CinetPay.
// Doc : https://docs.cinetpay.com/api/1.0-en/checkout/verification
// À utiliser TOUJOURS avant de créditer un paiement suite à une notification
// webhook — on ne fait jamais confiance à la seule notification, qui peut
// en théorie être falsifiée (recommandation officielle CinetPay).
export async function verifierTransactionCinetPay(params: ParamsVerification) {
  const reponse = await fetch(
    "https://api-checkout.cinetpay.com/v2/payment/check",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: params.apiKey,
        site_id: params.siteId,
        transaction_id: params.transactionId,
      }),
    }
  );

  const resultat = await reponse.json();

  return {
    statut: resultat.data?.status as string | undefined, // "ACCEPTED" | "REFUSED"
    montant: resultat.data?.amount as number | undefined,
    devise: resultat.data?.currency as string | undefined,
    methodePaiement: resultat.data?.payment_method as string | undefined,
  };
}
