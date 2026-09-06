import { signOut } from "@/auth";
import { Marque } from "@/components/Marque";

// En-tête commun aux espaces authentifiés (Directeur, Caisse, Super Admin) :
// marque + rôle/nom de la personne connectée + déconnexion. Avant cet
// ajout, il n'y avait tout simplement aucun moyen de se déconnecter depuis
// l'interface.
export function EnteteEspace({
  role,
  nomUtilisateur,
}: {
  role: string;
  nomUtilisateur?: string | null;
}) {
  async function deconnexion() {
    "use server";
    await signOut({ redirectTo: "/connexion" });
  }

  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Marque taille="sm" />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-500 sm:inline">
            {nomUtilisateur ? `${nomUtilisateur} — ` : ""}
            {role}
          </span>
          <form action={deconnexion}>
            <button
              type="submit"
              className="text-sm font-medium text-gray-500 transition hover:text-red-600"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
