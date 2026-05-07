import type { Metadata, Viewport } from "next";
import { Geist, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "INFLUNEXT — Plataforma de Marketing de Influência Pro Max",
    template: "%s | InfluNext"
  },
  description: "A plataforma #1 de marketing de influência para criadores e marcas no Brasil. Gerencie campanhas, escale seu alcance com IA e garanta pagamentos seguros com nosso sistema de Escrow.",
  keywords: ["marketing de influência", "influenciadores brasil", "marketplace de influenciadores", "gestão de campanhas de influência", "IA para influenciadores", "pagamento seguro influenciador", "agência de influenciadores"],
  authors: [{ name: "InfluNext Team" }],
  creator: "InfluNext",
  publisher: "InfluNext",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://influnext.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "INFLUNEXT — Plataforma de Marketing de Influência Pro Max",
    description: "Conecte marcas e influenciadores com segurança de Escrow e Inteligência Artificial.",
    url: 'https://influnext.com.br',
    siteName: 'InfluNext',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'InfluNext Pro Max Dashboard',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "INFLUNEXT — O Futuro da Influência",
    description: "Workspace estratégico com IA para criadores de elite.",
    images: ['/og-image.png'],
    creator: '@influnext',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json'
};

import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceManager } from "@/components/appearance-manager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Performance Hints: Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col selection:bg-purple-500/30 font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppearanceManager />
          <div className="flex-1 flex flex-col">
             {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
