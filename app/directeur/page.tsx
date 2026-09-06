import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Dashboard Directeur — vue de supervision. Cette première version se
// recalcule à chaque chargement de page (pas encore de push temps réel
// via Supabase Realtime, ce sera une étape séparée si besoin).
export default async function DirecteurPage() {
  const session = await auth();
  if (!session?.user?.ecoleId) {
    redirect("/connexion");
  }
  const ecoleId = session.user.ecoleId;

  const [eleves, tarifs, tranches, paiements] = await Promise.all([
    prisma.eleve.findMany({ where: { ecoleId }, include: { niveau: true } }),
    prisma.tarifTranche.findMany({ where: { niveau: { ecoleId } } }),
    prisma.tranche.findMany({ where: { ecoleId } }),
    prisma.paiement.findMany({ where: { eleve: { ecoleId } } }),
  ]);

  const trancheById = new Map(tranches.map((t) => [t.id, t]));

  const tarifParCle = new Map<string, number>();
  for (const tarif of tarifs) {
    tarifParCle.set(`${tarif.niveauId}__${tarif.trancheId}`, tarif.montant);
  }

  const payeParEleveTranche = new Map<string, number>();
  for (const paiement of paiements) {
    const cle = `${paiement.eleveId}__${paiement.trancheId}`;
    payeParEleveTranche.set(cle, (payeParEleveTranche.get(cle) ?? 0) + paiement.montant);
  }

  const maintenant = new Date();
  const debutAujourdHui = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate()
  );
  const debutDuMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

  let totalDu = 0;
  let totalPaye = 0;
  let encaisseAujourdHui = 0;
  let encaisseCeMois = 0;

  for (const paiement of paiements) {
    totalPaye += paiement.montant;
    if (paiement.date >= debutAujourdHui) encaisseAujourdHui += paiement.montant;
    if (paiement.date >= debutDuMois) encaisseCeMois += paiement.montant;
  }

  type Retard = {
    eleveId: string;
    nomComplet: string;
    niveau: string;
    tranche: string;
    montant: number;
    dateEcheance: Date;
  };
  const retards: Retard[] = [];

  for (const eleve of eleves) {
    for (const tranche of tranches) {
      const du = tarifParCle.get(`${eleve.niveauId}__${tranche.id}`);
      if (du === undefined) continue; // pas de tarif défini pour ce niveau/tranche
      totalDu += du;

      const paye = payeParEleveTranche.get(`${eleve.id}__${tranche.id}`) ?? 0;
      const solde = du - paye;

      if (tranche.dateEcheance && tranche.dateEcheance < maintenant && solde > 0) {
        retards.push({
          eleveId: eleve.id,
          nomComplet: `${eleve.prenom} ${eleve.nom}`,
          niveau: eleve.niveau.nom,
          tranche: tranche.nom,
          montant: solde,
          dateEcheance: tranche.dateEcheance,
        });
      }
    }
  }

  const totalImpayes = totalDu - totalPaye;
  const tauxRecouvrement = totalDu > 0 ? Math.round((totalPaye / totalDu) * 1000) / 10 : null;

  const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-gray-600">
        Connecté : {session.user.name}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Encaissé aujourd&apos;hui</div>
          <div className="mt-1 text-lg font-semibold">{fcfa(encaisseAujourdHui)}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Encaissé ce mois</div>
          <div className="mt-1 text-lg font-semibold">{fcfa(encaisseCeMois)}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Total encaissé</div>
          <div className="mt-1 text-lg font-semibold">{fcfa(totalPaye)}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Total dû</div>
          <div className="mt-1 text-lg font-semibold">{fcfa(totalDu)}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Impayés</div>
          <div className="mt-1 text-lg font-semibold text-red-600">
            {fcfa(totalImpayes)}
          </div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Taux de recouvrement</div>
          <div className="mt-1 text-lg font-semibold">
            {tauxRecouvrement === null ? "—" : `${tauxRecouvrement}%`}
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">
        Élèves en retard ({retards.length})
      </h2>
      <table className="mt-3 w-full rounded border bg-white text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left">Élève</th>
            <th className="p-2 text-left">Niveau</th>
            <th className="p-2 text-left">Tranche</th>
            <th className="p-2 text-left">Échéance</th>
            <th className="p-2 text-right">Montant dû</th>
          </tr>
        </thead>
        <tbody>
          {retards.length === 0 && (
            <tr>
              <td colSpan={5} className="p-3 text-center text-gray-500">
                Aucun retard pour l&apos;instant.
              </td>
            </tr>
          )}
          {retards.map((r, i) => (
            <tr key={`${r.eleveId}-${i}`} className="border-b">
              <td className="p-2">{r.nomComplet}</td>
              <td className="p-2">{r.niveau}</td>
              <td className="p-2">{r.tranche}</td>
              <td className="p-2">
                {r.dateEcheance.toLocaleDateString("fr-FR")}
              </td>
              <td className="p-2 text-right font-medium text-red-600">
                {fcfa(r.montant)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
