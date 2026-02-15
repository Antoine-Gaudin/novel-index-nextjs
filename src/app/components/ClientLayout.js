"use client";

import { AnimatePresence } from "framer-motion";
import Menu from "./Menu";
import { GoogleAnalytics } from "nextjs-google-analytics";
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
    </AuthProvider>
  );
}
