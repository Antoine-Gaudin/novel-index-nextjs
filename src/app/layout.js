"use client";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "nextjs-google-analytics";
import Menu from "./components/Menu";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Trad-Index - Plateforme d'indexation collaborative de redirection des utilisateur vers les sites traducteurs." />
        <meta name="keywords" content="traductions, index, œuvres, Trad-Index" />
        <meta name="author" content="Trad-Index" />
        <title>Novel-index</title>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9369868670279081" crossOrigin="anonymous"></script>
      </head>
      <body className="bg-gray-900 text-white">
        <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
        <Menu />

        {/* 👇 Transition intégrée directement ici */}
        <AnimatePresence mode="wait">

            {children}

        </AnimatePresence>

        <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Novel-index. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

