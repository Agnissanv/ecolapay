"use client";

import { useState } from "react";

// Champ mot de passe / clé secrète avec bouton "afficher/masquer" — un
// input type="password" natif n'a pas cet œil par défaut, et Isaac a
// raison de le demander : sur un champ comme la clé API CinetPay, ne pas
// pouvoir vérifier ce qu'on a tapé/collé est source d'erreurs.
export function ChampSecret({
  name,
  required,
  placeholder,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-ink placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Masquer" : "Afficher"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition hover:text-gray-600"
      >
        {visible ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M10.58 10.58a2 2 0 102.83 2.83M9.88 4.24A9.9 9.9 0 0112 4c5 0 9 4 10.5 8-.46 1.31-1.17 2.6-2.1 3.73M6.6 6.6C4.6 8 3.1 9.9 1.5 12c1 2.2 2.8 4.3 5.2 5.7A9.9 9.9 0 0012 20c1.2 0 2.35-.2 3.4-.56"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M1.5 12S5 4 12 4s10.5 8 10.5 8-3.5 8-10.5 8S1.5 12 1.5 12z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
