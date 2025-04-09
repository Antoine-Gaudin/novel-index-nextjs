"use client";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "nextjs-google-analytics";
import Menu from "./components/Menu";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const defaultHead = useRef({});

  // 🔒 Sauvegarde les métadonnées par défaut UNE FOIS
  useEffect(() => {
    defaultHead.current = {
      title: document.title,
      description: document.querySelector("meta[name='description']")?.getAttribute("content"),
      canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href"),
    };
  }, []);

  // 🔁 Sur chaque changement de route, si on quitte la page oeuvre, on restaure
  useEffect(() => {
    const isOeuvrePage = pathname.startsWith("/oeuvre/");

    if (!isOeuvrePage && defaultHead.current.title) {
      // ✅ Restaure le <title>
      document.title = defaultHead.current.title;

      // ✅ Restaure la description
      let metaDescription = document.querySelector("meta[name='description']");
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.name = "description";
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", defaultHead.current.description);

      // ✅ Restaure le canonical
      let linkCanonical = document.querySelector("link[rel='canonical']");
      if (!linkCanonical) {
        linkCanonical = document.createElement("link");
        linkCanonical.setAttribute("rel", "canonical");
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute("href", defaultHead.current.canonical);
    }
  }, [pathname]);

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Trad-Index - Plateforme d'indexation collaborative de redirection des utilisateur vers les sites traducteurs." />
        <meta name="keywords" content="traductions, index, œuvres, Trad-Index" />
        <meta name="author" content="Trad-Index" />
        <title>Novel-index</title>
        <link rel="canonical" href="https://novel-index.com" />
        <link rel="icon" type="image/png" href="/logo.png" sizes="64x64" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9369868670279081" crossOrigin="anonymous"></script>
        <meta name="google-site-verification" content="4jR6pkhui9OKp62A2MVsaj6jWc9Dywhab3eHjjsAkLA" />
      </head>
      <body className="bg-gray-900 text-white">
        <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
        <Menu />

        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>

        <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>&copy; {new Date().getFullYear()} Novel-index. Tous droits réservés.</p>
            <div className="flex gap-4">
              <a
                href="https://x.com/Index_Novel"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://discord.gg/kgP6eB3Crd"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
