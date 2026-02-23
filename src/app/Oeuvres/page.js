import CatalogueClient from "./CatalogueClient";
import Link from "next/link";
import { FiHome, FiChevronRight, FiGrid } from "react-icons/fi";
import CoverBackground from "@/app/components/CoverBackground";

export default async function OeuvresPage({ searchParams }) {
  const sp = await searchParams;
  const rawPage = parseInt(sp?.page);
  const initialPage = !isNaN(rawPage) && rawPage > 1 ? rawPage - 1 : 0;
  const pageSize = 12;

  // S1: SSR fetch — données initiales pour Googlebot & premier affichage
  let initialOeuvres = [];
  let initialTotal = 0;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const start = initialPage * pageSize;
    const res = await fetch(
      `${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${start}&pagination[limit]=${pageSize}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      initialOeuvres = data.data || [];
      initialTotal = data.meta?.pagination?.total || 0;
    }
  } catch (e) {
    console.error("SSR fetch error:", e);
  }

  return (
    <div className="relative bg-gray-900 text-white min-h-screen">
      {/* Background hero — positionné depuis le vrai top de la page */}
      <div className="absolute inset-x-0 top-0 h-[700px] overflow-hidden pointer-events-none">
        <CoverBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-[5]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60 z-[6]" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[7]" />
      </div>

      {/* S7: Breadcrumb visible (SSR) */}
      <nav
        aria-label="Fil d'Ariane"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-2"
      >
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li>
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <FiHome className="text-xs" /> Accueil
            </Link>
          </li>
          <li>
            <FiChevronRight className="text-xs" />
          </li>
          <li className="text-white font-medium">Catalogue des œuvres</li>
        </ol>
      </nav>

      {/* S1: Titre principal rendu côté serveur pour le SEO */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center pt-4 pb-2">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center justify-center gap-3">
          <FiGrid className="text-indigo-400" />
          Catalogue
        </h1>
        <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto mt-3">
          Explorez notre collection de {initialTotal.toLocaleString()} œuvres :
          webnovels, light novels, manhwa, manga et plus encore.
        </p>
      </div>

      <CatalogueClient
        initialOeuvres={initialOeuvres}
        initialTotal={initialTotal}
        initialPage={initialPage}
      />
    </div>
  );
}
