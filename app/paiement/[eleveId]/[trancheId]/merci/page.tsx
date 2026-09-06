// Page PUBLIQUE de retour après le paiement CinetPay (return_url). Purement
// informative : elle ne confirme RIEN par elle-même — seul le webhook
// CinetPay (à construire ensuite) + la vérification côté serveur font foi.
export default function PagePaiementMerci() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">Merci !</h1>
      <p className="mt-2 text-sm text-gray-600">
        Ton paiement est en cours de vérification. L&apos;école recevra la
        confirmation automatiquement dès que CinetPay aura validé la
        transaction.
      </p>
      <p className="mt-4 text-xs text-gray-400">Tu peux fermer cette page.</p>
    </div>
  );
}
