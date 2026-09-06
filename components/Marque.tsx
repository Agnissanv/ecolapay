// Logotype EcolaPay : icône (bulle de chat + check, clin d'œil au
// recouvrement automatisé par WhatsApp) + wordmark texte en deux couleurs.
// Même SVG que app/icon.svg (favicon), couleurs en dur pour rester
// identique partout où la marque apparaît.
const taillesTexte = {
  sm: "text-base",
  base: "text-xl",
  lg: "text-3xl",
} as const;

const taillesIcone = {
  sm: "h-5 w-5",
  base: "h-6 w-6",
  lg: "h-9 w-9",
} as const;

export function Marque({
  taille = "base",
}: {
  taille?: "sm" | "base" | "lg";
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        className={taillesIcone[taille]}
        aria-hidden="true"
      >
        <rect x="4" y="5" width="24" height="18" rx="7" fill="#3730A3" />
        <path d="M7 23 L5 29 L12 23 Z" fill="#3730A3" />
        <path
          d="M11 15l3.2 3.2L21.5 10.3"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="26" cy="6.5" r="4.5" fill="#D97706" />
      </svg>
      <span className={`font-extrabold tracking-tight ${taillesTexte[taille]}`}>
        <span className="text-brand-700">Ecola</span>
        <span className="text-accent-600">Pay</span>
      </span>
    </span>
  );
}
