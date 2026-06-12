import type { Metadata, Viewport } from "next";
import { Geist, Outfit } from "next/font/google";
import "./globals.css";
import fs from 'fs';
import path from 'path';

// Dynamic copy of generated PNG icons to public directory
try {
  const srcPath = 'C:\\Users\\alexs\\.gemini\\antigravity\\brain\\100492a8-6c2f-4eb3-b693-b4e5e9c6a6ba\\influnext_pwa_icon_1781218488314.png';
  const destIcon = path.join(process.cwd(), 'public', 'icon.png');
  const destAppleIcon = path.join(process.cwd(), 'public', 'apple-icon.png');
  
  if (fs.existsSync(srcPath)) {
    if (!fs.existsSync(destIcon)) {
      fs.copyFileSync(srcPath, destIcon);
      console.log('Successfully copied icon.png to public!');
    }
    if (!fs.existsSync(destAppleIcon)) {
      fs.copyFileSync(srcPath, destAppleIcon);
      console.log('Successfully copied apple-icon.png to public!');
    }
  }
} catch (err) {
  console.error('Failed to copy PWA icons:', err);
}

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
    default: "InfluNext — Influência que Gera Resultado Real",
    template: "%s | InfluNext"
  },
  description: "A plataforma que une criadores verificados e marcas sérias com métricas auditadas, contratos inteligentes e Escrow seguro. Chega de calote. Chega de permuta.",
  keywords: ["marketing de influência", "influenciadores verificados", "escrow pagamento influencer", "plataforma influencer brasil", "gestão influenciador", "IA criadores conteúdo", "InfluNext"],
  authors: [{ name: "InfluNext Team" }],
  creator: "InfluNext",
  publisher: "InfluNext",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://influnext.com.br'),
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "InfluNext — A plataforma que une Influenciadores e Marcas com segurança real",
    description: "Métricas auditadas, Escrow financeiro e IA para criadores e marcas que levam influência a sério.",
    url: 'https://influnext.com.br',
    siteName: 'InfluNext',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'InfluNext — Influência que Gera Resultado' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "InfluNext — Influência que Gera Resultado Real",
    description: "Métricas auditadas, Escrow e IA. A plataforma mais séria do Brasil para criadores e marcas.",
    images: ['/og-image.png'],
    creator: '@influnext',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: '/manifest.json'
};

import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceManager } from "@/components/appearance-manager";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

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
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableThemeOnChange
          disableTransitionOnChange
        >
          <AppearanceManager />
          <PwaInstallPrompt />
          <div className="flex-1 flex flex-col">
             {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
