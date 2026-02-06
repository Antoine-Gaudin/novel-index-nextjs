"use client";

import { AnimatePresence } from "framer-motion";
import Menu from "./Menu";
import { GoogleAnalytics } from "nextjs-google-analytics";
import Link from "next/link";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
      <Menu />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>&copy; {new Date().getFullYear()} Novel-index. Tous droits réservés.</p>
          <div className="flex gap-4 items-center">
            <Link
              href="/sitemap"
              className="hover:text-white transition-colors"
            >
              Plan du site
            </Link>
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
    </AuthProvider>
  );
}
