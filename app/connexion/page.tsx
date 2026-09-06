import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Marque } from "@/components/Marque";
import { boutonPrimaire, champTexte, etiquette } from "@/lib/ui";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function connecter(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/connexion?error=1");
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Marque taille="lg" />
        </div>

        <form
          action={connecter}
          className="space-y-4 rounded-2xl border border-black/5 bg-white p-8 shadow-lg shadow-brand-900/5"
        >
          <div>
            <h1 className="text-lg font-semibold text-ink">Connexion</h1>
            <p className="mt-1 text-sm text-gray-500">
              Accède à l&apos;espace de ton école.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Email ou mot de passe incorrect.
            </p>
          )}

          <div>
            <label className={etiquette}>Email</label>
            <input name="email" type="email" required className={champTexte} />
          </div>

          <div>
            <label className={etiquette}>Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className={champTexte}
            />
          </div>

          <button type="submit" className={`w-full ${boutonPrimaire}`}>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
