"use client";

import Menu from "./Menu";
import { GoogleAnalytics } from "nextjs-google-analytics";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
      <ProgressBar
        height="3px"
        color="linear-gradient(to right, #4f46e5, #7c3aed)"
        options={{ showSpinner: false }}
        shallowRouting
      />
      {/* Lien d'accessibilité — skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Aller au contenu principal
      </a>
      <Menu />

      <main id="main-content" className="pt-16">
        {children}
      </main>
    </AuthProvider>
  );
}
