import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InfluNext — Marketplace de Influência",
  description: "Conecte marcas e influenciadores com contratos inteligentes e pagamentos seguros via Escrow.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#080810] text-[#e8e0f5] flex flex-col selection:bg-purple-500/30">
        {children}
      </body>
    </html>
  );
}
