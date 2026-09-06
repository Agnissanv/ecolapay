import { Marque } from "@/components/Marque";
import { carte } from "@/lib/ui";

// Page PUBLIQUE de retour après le paiement CinetPay (return_url). Purement
// informative : elle ne confirme RIEN par elle-même — seul le webhook
// CinetPay + la vérification côté serveur font foi.
export default function PagePaiementMerci() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Marque taille="base" />

      <div className={`mt-6 w-full max-w-sm text-center ${carte}`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-6 w-6 text-green-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink">Merci !</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ton paiement est en cours de vérification. L&apos;école recevra la
          confirmation automatiquement dès que CinetPay aura validé la
          transaction.
        </p>
        <p className="mt-4 text-xs text-gray-400">Tu peux fermer cette page.</p>
      </div>
    </div>
  );
}
