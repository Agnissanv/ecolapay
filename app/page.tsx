import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Marque } from "@/components/Marque";
import { boutonAccent, boutonSecondaire, carte } from "@/lib/ui";

// Page d'accueil : routeur pour les personnes déjà connectées (vers leur
// espace selon leur rôle), landing page publique pour tout le monde
// d'autre — c'est la seule page qui explique ce qu'est EcolaPay à un
// directeur d'école qui découvre le produit.
//
// Numéro de contact Code A-Z (EcolaPay n'a pas encore son propre numéro).
const NUMERO_WHATSAPP = "2250546797258";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    switch (session.user.role) {
      case "SUPER_ADMIN":
        redirect("/admin");
      case "DIRECTEUR":
        redirect("/directeur");
      case "CAISSE":
        redirect("/caisse");
      default:
        redirect("/connexion");
    }
  }

  const messageWhatsapp = encodeURIComponent(
    "Bonjour, je suis intéressé(e) par EcolaPay pour mon école."
  );
  const lienWhatsapp = `https://wa.me/${NUMERO_WHATSAPP}?text=${messageWhatsapp}`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Marque taille="sm" />
          <Link
            href="/connexion"
            className="text-sm font-medium text-gray-600 hover:text-brand-700"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          La caisse de ton école, sans le bazar de fin de mois.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          EcolaPay enregistre chaque paiement de scolarité en quelques
          secondes, calcule automatiquement qui doit quoi, et permet aux
          parents de payer en ligne directement sur le compte de
          l&apos;école — par Wave, Orange Money, MTN ou Moov Money.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={lienWhatsapp} target="_blank" className={boutonAccent}>
            Discuter avec nous sur WhatsApp
          </a>
          <Link href="/connexion" className={boutonSecondaire}>
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-sm font-semibold tracking-wide text-brand-600 uppercase">
            Le problème
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-gray-700">
            Cahiers de recouvrement, WhatsApp perso du comptable, relances au
            hasard : la plupart des écoles perdent du temps — et de
            l&apos;argent — à suivre qui a payé quoi, et quand.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className={carte}>
            <h3 className="font-semibold text-ink">Caisse Éclair</h3>
            <p className="mt-2 text-sm text-gray-600">
              La caissière retrouve un élève, encaisse un paiement (espèces ou
              mobile money), et le solde se met à jour tout seul. Fini les
              calculs à la main.
            </p>
          </div>
          <div className={carte}>
            <h3 className="font-semibold text-ink">Paiement en ligne</h3>
            <p className="mt-2 text-sm text-gray-600">
              Un lien envoyé par WhatsApp, le parent paie directement en
              ligne — l&apos;argent arrive sur le compte de l&apos;école,
              jamais chez EcolaPay.
            </p>
          </div>
          <div className={carte}>
            <h3 className="font-semibold text-ink">Tableau de bord</h3>
            <p className="mt-2 text-sm text-gray-600">
              Encaissements du jour, du mois, taux de recouvrement, élèves en
              retard — le directeur voit tout d&apos;un coup d&apos;œil.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-brand-900 py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-xl font-semibold">
            L&apos;argent de ton école reste sur ton compte.
          </h2>
          <p className="mt-3 text-brand-100">
            EcolaPay ne touche jamais aux fonds. Chaque école connecte son
            propre compte marchand — les paiements en ligne vont directement
            chez elle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-ink">
          Prêt à arrêter de courir après les paiements ?
        </h2>
        <a
          href={lienWhatsapp}
          target="_blank"
          className={`mt-6 inline-flex ${boutonAccent}`}
        >
          Discuter avec nous sur WhatsApp
        </a>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} EcolaPay — Code A-Z
      </footer>
    </div>
  );
}
