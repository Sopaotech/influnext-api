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
  themeColor: '#d96b27',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "InfluNext | Plataforma de Marketing de Influência & SafePay Escrow",
    template: "%s | InfluNext"
  },
  description: "Conecte sua marca a criadores de conteúdo verificados. Parcerias seguras com métricas auditadas, contratos inteligentes e custódia SafePay Escrow.",
  keywords: ["marketing de influência", "influenciadores verificados", "escrow pagamento influencer", "plataforma influencer brasil", "gestão influenciador", "SafePay Escrow", "InfluNext"],
  authors: [{ name: "InfluNext Team" }],
  creator: "InfluNext",
  publisher: "InfluNext",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://influnext.com.br'),
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.ico?v=6', sizes: 'any' },
      { url: '/icon-48.png?v=6', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png?v=6', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png?v=6', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.svg?v=6', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico?v=6',
    apple: [
      { url: '/apple-icon.png?v=6', sizes: '180x180', type: 'image/png' }
    ]
  },
  openGraph: {
    title: "InfluNext | Plataforma de Marketing de Influência & SafePay Escrow",
    description: "A plataforma oficial que une criadores verificados e marcas com métricas auditadas (SHA-256) e pagamentos sob custódia segura.",
    url: 'https://influnext.com.br',
    siteName: 'InfluNext',
    images: [{ url: '/logo-concept2b.png?v=6', width: 1200, height: 630, alt: 'InfluNext — SafePay Escrow & Influencer Marketing' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "InfluNext | Plataforma de Marketing de Influência & SafePay Escrow",
    description: "Métricas auditadas, SafePay Escrow e IA. A plataforma mais séria do Brasil para criadores e marcas.",
    images: ['/logo-concept2b.png?v=6'],
    creator: '@influnext',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: '/manifest.json?v=6'
};

import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceManager } from "@/components/appearance-manager";
import { AppStandbyNotice } from "@/components/AppStandbyNotice";

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
        {/* Google & Search Engine Favicons and Mobile Headers */}
        <link rel="icon" href="/favicon.ico?v=6" sizes="any" />
        <link rel="icon" href="/icon-48.png?v=6" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-192.png?v=6" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon.png?v=6" type="image/png" sizes="512x512" />
        <link rel="icon" href="/favicon.svg?v=6" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=6" sizes="180x180" />
        {/* Performance Hints: Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col selection:bg-orange-500/30 font-sans">
        {/* Google Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://influnext.com.br/#organization",
                  "name": "InfluNext",
                  "url": "https://influnext.com.br",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://influnext.com.br/logo-concept2b.png",
                    "width": 1035,
                    "height": 190
                  },
                  "image": "https://influnext.com.br/logo-concept2b.png",
                  "description": "Plataforma líder para gestão de parcerias entre marcas e influenciadores com contratos inteligentes e custódia segura SafePay Escrow.",
                  "sameAs": [
                    "https://instagram.com/influnext",
                    "https://twitter.com/influnext"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://influnext.com.br/#website",
                  "url": "https://influnext.com.br",
                  "name": "InfluNext",
                  "publisher": { "@id": "https://influnext.com.br/#organization" }
                }
              ]
            })
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableThemeOnChange={false}
          disableTransitionOnChange
        >
          <AppearanceManager />
          <AppStandbyNotice />
          <div className="flex-1 flex flex-col">
             {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
