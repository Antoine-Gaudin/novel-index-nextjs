"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";

export default function CtaInscription() {
  const { isLoggedIn, isLoading } = useAuth();

  // Ne pas afficher le CTA si l'utilisateur est connecté ou en chargement
  if (isLoading || isLoggedIn) return null;

  return (
    <div className="text-center mt-12">
      <Link
        href="/Inscription"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition shadow-lg hover:shadow-indigo-500/25"
      >
        Créer un compte gratuit
        <FiArrowRight />
      </Link>
    </div>
  );
}
