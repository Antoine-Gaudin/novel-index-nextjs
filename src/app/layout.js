"use client";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "nextjs-google-analytics";
import Menu from "./components/Menu"; // ✅ Importation du menu
import { UserProvider } from "./context/UserContext";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <UserProvider>
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Trad-Index - Plateforme d'indexation collaborative de redirection des utilisateur vers les sites traducteurs." />
        <meta name="keywords" content="traductions, index, œuvres, Trad-Index" />
        <meta name="author" content="Trad-Index" />
        <title>Novel-index</title>
      </head>
      <body className="bg-gray-900 text-white">
        <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
        <Menu /> {/* ✅ Le menu est maintenant un composant réutilisable */}

        <main className="min-h-screen">{children}</main>
        <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Novel-index. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
    </UserProvider>
  );
}
