"use client";

import { AnimatePresence } from "framer-motion";
import Menu from "./Menu";
import { GoogleAnalytics } from "nextjs-google-analytics";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
      {/* Lien d'accessibilité — skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Aller au contenu principal
      </a>
      <Menu />

      <main id="main-content" className="pt-16">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </AuthProvider>
  );
}
