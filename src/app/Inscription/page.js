"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const InscriptionRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Connexion?mode=inscription");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      Redirection...
    </div>
  );
};

export default InscriptionRedirect;
