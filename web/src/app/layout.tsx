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
    default: "InfluNext — A Plataforma #1 de Gestão para Influenciadores de Elite",
    template: "%s | InfluNext"
  },
  description: "Transforme sua influência em um negócio de alto nível. Gestão estratégica, Media Kit dinâmico, pagamentos seguros com Escrow e suporte de IA para criadores e marcas.",
  keywords: ["marketing de influência", "gestão de carreira influenciador", "pagamento seguro escrow", "media kit digital", "influenciadores de elite", "IA para criadores", "InfluNext"],
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
    title: "InfluNext — O Futuro do Marketing de Influência",
    description: "Conecte marcas e influenciadores com segurança total e Inteligência Artificial.",
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
    title: "InfluNext — Seu Escritório Digital Neural",
    description: "Gestão estratégica para criadores que buscam o próximo nível.",
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

  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/icon.svg',
  }
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
        {/* Google Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "InfluNext",
              "url": "https://influnext.com.br",
              "logo": "https://influnext.com.br/icon.png",
              "description": "Plataforma de elite para gestão de carreira de influenciadores e marcas.",
              "sameAs": [
                "https://instagram.com/influnext",
                "https://twitter.com/influnext"
              ]
            })
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableThemeOnChange={false}
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
