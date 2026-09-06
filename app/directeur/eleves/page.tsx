import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

// Page Directeur : gestion des élèves de son école. Étape 4 (dernière) de
// la config école — nécessite qu'au moins un niveau existe déjà.
export default async function ElevesPage() {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const niveaux = await prisma.niveau.findMany({
    where: { ecoleId },
    orderBy: { ordre: "asc" },
  });

  const eleves = await prisma.eleve.findMany({
    where: { ecoleId },
    include: { niveau: true },
    orderBy: [{ niveau: { ordre: "asc" } }, { nom: "asc" }],
  });

  async function ajouterEleve(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const nom = (formData.get("nom") as string)?.trim();
    const prenom = (formData.get("prenom") as string)?.trim();
    const parentNom = (formData.get("parentNom") as string)?.trim();
    const parentTelephone = (formData.get("parentTelephone") as string)?.trim();
    const niveauId = formData.get("niveauId") as string;

    if (!nom || !prenom || !parentNom || !parentTelephone || !niveauId) {
      return;
    }

    // Sécurité : le niveau choisi doit appartenir à l'école du directeur.
    const niveau = await prisma.niveau.findUnique({ where: { id: niveauId } });
    if (!niveau || niveau.ecoleId !== ecoleId) return;

    await prisma.eleve.create({
      data: { nom, prenom, parentNom, parentTelephone, niveauId, ecoleId },
    });

    redirect("/directeur/eleves");
  }

  async function supprimerEleve(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.ecoleId) redirect("/connexion");
    const ecoleId = session.user.ecoleId;

    const id = formData.get("id") as string;
    const eleve = await prisma.eleve.findUnique({ where: { id } });
    if (!eleve || eleve.ecoleId !== ecoleId) {
      redirect("/directeur/eleves");
    }

    try {
      await prisma.eleve.delete({ where: { id } });
    } catch {
      // L'élève a probablement déjà des paiements enregistrés (contrainte
      // de clé étrangère) : on ne peut pas le supprimer pour l'instant.
    }

    redirect("/directeur/eleves");
  }

  if (niveaux.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">Élèves</h1>
        <p className="mt-2 text-sm text-gray-600">
          Il faut d&apos;abord créer au moins un niveau avant de pouvoir
          ajouter des élèves.
        </p>
        <Link
          href="/directeur/niveaux"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Aller à Niveaux
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-semibold">Élèves de l&apos;école</h1>
      <p className="mt-1 text-sm text-gray-600">
        Le numéro WhatsApp est celui du parent qui paie — c&apos;est sur ce
        numéro que les reçus et rappels seront envoyés automatiquement.
      </p>

      <form
        action={ajouterEleve}
        className="mt-6 grid grid-cols-1 gap-2 rounded border bg-white p-4 sm:grid-cols-2"
      >
        <input
          name="nom"
          type="text"
          required
          placeholder="Nom de l'élève"
          className="rounded border px-3 py-2"
        />
        <input
          name="prenom"
          type="text"
          required
          placeholder="Prénom de l'élève"
          className="rounded border px-3 py-2"
        />
        <input
          name="parentNom"
          type="text"
          required
          placeholder="Nom du parent (celui qui paie)"
          className="rounded border px-3 py-2"
        />
        <input
          name="parentTelephone"
          type="tel"
          required
          placeholder="Numéro WhatsApp, ex : +2250700000000"
          className="rounded border px-3 py-2"
        />
        <select
          name="niveauId"
          required
          defaultValue=""
          className="rounded border px-3 py-2 sm:col-span-2"
        >
          <option value="" disabled>
            Choisir un niveau
          </option>
          {niveaux.map((niveau) => (
            <option key={niveau.id} value={niveau.id}>
              {niveau.nom}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white sm:col-span-2"
        >
          Ajouter l&apos;élève
        </button>
      </form>

      <ul className="mt-6 divide-y rounded border bg-white">
        {eleves.length === 0 && (
          <li className="p-3 text-sm text-gray-500">
            Aucun élève pour l&apos;instant.
          </li>
        )}
        {eleves.map((eleve) => (
          <li
            key={eleve.id}
            className="flex items-center justify-between p-3"
          >
            <div>
              <div className="font-medium">
                {eleve.prenom} {eleve.nom}{" "}
                <span className="text-sm text-gray-500">
                  ({eleve.niveau.nom})
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Parent : {eleve.parentNom} — {eleve.parentTelephone}
              </div>
            </div>
            <form action={supprimerEleve}>
              <input type="hidden" name="id" value={eleve.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
