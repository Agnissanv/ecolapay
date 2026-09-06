import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Dans Next.js 16, ce fichier remplace l'ancien "middleware.ts".
// Il protège les routes /admin, /directeur et /caisse selon le rôle connecté.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const estProtegee =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/directeur") ||
    pathname.startsWith("/caisse");

  if (estProtegee && !req.auth) {
    return NextResponse.redirect(new URL("/connexion", req.nextUrl.origin));
  }

  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/connexion", req.nextUrl.origin));
  }

  if (pathname.startsWith("/directeur") && role !== "DIRECTEUR") {
    return NextResponse.redirect(new URL("/connexion", req.nextUrl.origin));
  }

  if (pathname.startsWith("/caisse") && role !== "CAISSE") {
    return NextResponse.redirect(new URL("/connexion", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/directeur/:path*", "/caisse/:path*"],
};
