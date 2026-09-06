// Logotype texte "EcolaPay" — pas de logo image pour l'instant, juste un
// lockup typographique en deux couleurs (marque + accent paiement).
export function Marque({
  taille = "base",
}: {
  taille?: "sm" | "base" | "lg";
}) {
  const tailles = {
    sm: "text-base",
    base: "text-xl",
    lg: "text-3xl",
  } as const;

  return (
    <span className={`font-extrabold tracking-tight ${tailles[taille]}`}>
      <span className="text-brand-700">Ecola</span>
      <span className="text-accent-600">Pay</span>
    </span>
  );
}
