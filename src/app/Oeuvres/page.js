import CatalogueClient from "./CatalogueClient";
import Link from "next/link";
import { FiHome, FiChevronRight, FiGrid } from "react-icons/fi";
import CoverBackground from "@/app/components/CoverBackground";

async function fetchSSR(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OeuvresPage({ searchParams }) {
  const sp = await searchParams;
  const rawPage = parseInt(sp?.page);
  const initialPage = !isNaN(rawPage) && rawPage > 1 ? rawPage - 1 : 0;
  const pageSize = 12;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const start = initialPage * pageSize;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // SSR: toutes les données en parallèle
  const [oeuvresRes, featuredRes, dernieresMajRes, nouveautesRes, chapitresRes, teamsRes] = await Promise.all([
    fetchSSR(`${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${start}&pagination[limit]=${pageSize}`),
    fetchSSR(`${apiUrl}/api/oeuvres?populate[0]=couverture&populate[1]=genres&pagination[limit]=10&filters[couverture][url][$notNull]=true`),
    fetchSSR(`${apiUrl}/api/oeuvres?populate=couverture&sort=updatedAt:desc&pagination[limit]=6`),
    fetchSSR(`${apiUrl}/api/oeuvres?populate=couverture&sort=createdAt:desc&pagination[limit]=6&filters[createdAt][$gte]=${monthStart}`),
    fetchSSR(`${apiUrl}/api/chapitres?pagination[limit]=1`),
    fetchSSR(`${apiUrl}/api/teams?pagination[limit]=1`),
  ]);

  const initialOeuvres = oeuvresRes?.data || [];
  const initialTotal = oeuvresRes?.meta?.pagination?.total || 0;
  const initialExtras = {
    featuredCandidates: (featuredRes?.data || []).filter(o => o.couverture?.url && o.synopsis),
    dernieresMaj: dernieresMajRes?.data || [],
    nouveautes: nouveautesRes?.data || [],
    stats: {
      chapitres: chapitresRes?.meta?.pagination?.total || 0,
      teams: teamsRes?.meta?.pagination?.total || 0,
    },
  };

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
        initialExtras={initialExtras}
      />
    </div>
  );
}
