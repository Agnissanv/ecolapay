import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Page Directeur : configuration du compte marchand CinetPay de son école
// (Site ID + clé API). L'activation du paiement en ligne et le pourcentage
// de frais de confort sont contrôlés uniquement par EcolaPay (Super Admin),
// pas par l'école elle-même — affichés ici en lecture seule.
export default async function PaiementPage() {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const ecole = await prisma.ecole.findUnique({ where: { id: ecoleId } });
  if (!ecole) {
    redirect("/connexion");
  }

  async function enregistrerConfigPaiement(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const cinetpaySiteId = (formData.get("cinetpaySiteId") as string)?.trim() || null;
    const nouvelleApiKey = (formData.get("cinetpayApiKey") as string)?.trim();

    await prisma.ecole.update({
      where: { id: ecoleId },
      data: {
        cinetpaySiteId,
        // On ne remplace la clé API que si une nouvelle valeur a été saisie,
        // pour ne pas l'effacer à chaque enregistrement du formulaire.
        ...(nouvelleApiKey ? { cinetpayApiKey: nouvelleApiKey } : {}),
      },
    });

    redirect("/directeur/paiement");
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold">Paiement en ligne</h1>
      <p className="mt-1 text-sm text-gray-600">
        Connecte le compte marchand CinetPay de ton école pour que les
        parents puissent payer directement en ligne via le lien WhatsApp —
        l&apos;argent va sur le compte de l&apos;école, jamais chez EcolaPay.
      </p>

      <div className="mt-4 rounded border bg-gray-50 p-3 text-sm">
        <p>
          Statut :{" "}
          <span className="font-medium">
            {ecole.paiementEnLigneActif
              ? "activé par EcolaPay"
              : "non activé pour l'instant"}
          </span>
        </p>
        <p className="mt-1 text-gray-600">
          Frais de confort appliqué au parent :{" "}
          {ecole.fraisConfortPourcent !== null
            ? `${ecole.fraisConfortPourcent}%`
            : "non défini"}{" "}
          — défini par EcolaPay, pas par l&apos;école.
        </p>
      </div>

      <form
        action={enregistrerConfigPaiement}
        className="mt-4 space-y-4 rounded border bg-white p-4"
      >
        <div>
          <label className="block text-sm font-medium">
            Site ID CinetPay
          </label>
          <input
            name="cinetpaySiteId"
            type="text"
            defaultValue={ecole.cinetpaySiteId ?? ""}
            placeholder="Ex : 123456"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Clé API CinetPay
          </label>
          <input
            name="cinetpayApiKey"
            type="password"
            placeholder={
              ecole.cinetpayApiKey
                ? "Déjà enregistrée — laisser vide pour ne pas changer"
                : "Coller la clé API CinetPay"
            }
            className="mt-1 w-full rounded border px-3 py-2"
          />
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
