import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "./components/ClientLayout";
import Footer from "./components/Footer";
import JsonLd from "./components/JsonLd";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Metadata SSR - Rendu cote serveur
export const metadata = {
  title: "Novel-Index - Plateforme d'indexation de traductions",
  description: "Novel-Index - Plateforme d'indexation collaborative de redirection des utilisateurs vers les sites traducteurs. Webnovels, light novels, manhwa et manga en français.",
  keywords: ["traductions", "index", "œuvres", "Trad-Index", "webnovels", "light novels", "manhwa", "manga"],
  authors: [{ name: "Trad-Index" }],
  icons: {
    icon: "/logo.png",
  },
  verification: {
    google: "4jR6pkhui9OKp62A2MVsaj6jWc9Dywhab3eHjjsAkLA",
  },
  alternates: {
    canonical: "https://www.novel-index.com",
  },
  openGraph: {
    title: "Novel-Index - Plateforme d'indexation de traductions",
    description: "Plateforme d'indexation collaborative de redirection des utilisateurs vers les sites traducteurs. Webnovels, light novels, manhwa et manga en français.",
    url: "https://www.novel-index.com",
    siteName: "Novel-Index",
    images: [{ url: "https://www.novel-index.com/logo.png", alt: "Novel-Index" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novel-Index - Plateforme d'indexation de traductions",
    description: "Plateforme d'indexation collaborative de redirection des utilisateurs vers les sites traducteurs.",
    images: ["https://www.novel-index.com/logo.png"],
    creator: "@Index_Novel",
  },
};

export default function RootLayout({ children }) {
  // JSON-LD pour WebSite - aide Google à comprendre la structure du site
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Novel-Index",
    "alternateName": "Trad-Index",
    "url": "https://www.novel-index.com",
    "description": "Plateforme d'indexation collaborative de redirection des utilisateurs vers les sites traducteurs",
    "inLanguage": "fr-FR",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.novel-index.com/Oeuvres?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // JSON-LD pour Organization - informations sur l'organisation
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Novel-Index",
    "url": "https://www.novel-index.com",
    "logo": "https://www.novel-index.com/logo.png",
    "description": "Plateforme collaborative pour découvrir et suivre les traductions de romans, webtoons et manhwas",
    "sameAs": [
      "https://x.com/Index_Novel",
      "https://discord.gg/kgP6eB3Crd"
    ]
  };

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {isProduction && (
          <script 
            async 
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9369868670279081" 
            crossOrigin="anonymous"
          />
        )}
        <JsonLd data={websiteJsonLd} />
        <JsonLd data={organizationJsonLd} />
      </head>
      <body className="bg-gray-900 text-white">
        <ClientLayout>
          {children}
        </ClientLayout>
        <Footer />
      </body>
    </html>
  );
}
