"use client";

import { useEffect } from "react";

// Enregistre le service worker côté client, une fois l'app chargée.
// Silencieux si ça échoue (vieux navigateur, etc.) — l'app fonctionne très
// bien sans, ça retire juste l'installabilité PWA.
export function EnregistrementPWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
