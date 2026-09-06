import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { EnregistrementPWA } from "@/components/EnregistrementPWA";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "EcolaPay",
  description:
    "EcolaPay — recouvrement des scolarités par WhatsApp pour les écoles privées.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcolaPay",
  },
};

export const viewport: Viewport = {
  themeColor: "#3730A3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {children}
        <EnregistrementPWA />
      </body>
    </html>
  );
}
