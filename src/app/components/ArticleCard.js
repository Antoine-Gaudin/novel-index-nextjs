import Link from "next/link";
import Image from "next/image";
import { FiCalendar, FiUser, FiTag } from "react-icons/fi";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;

export default function ArticleCard({ article, featured = false }) {
  const couverture = article.couverture?.url
    ? `${STRAPI}${article.couverture.url}`
    : null;

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const auteur = article.auteur?.username || article.auteur?.email || null;

  if (featured) {
    return (
      <Link
        href={`/actualites/${article.slug}`}
        className="group block col-span-full rounded-2xl overflow-hidden bg-gray-800/50 border border-gray-700 hover:border-indigo-500 transition-all"
      >
        <div className="flex flex-col md:flex-row">
          {couverture && (
            <div className="relative w-full md:w-1/2 h-56 md:h-72 overflow-hidden">
              <Image
                src={couverture}
                alt={article.titre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="flex-1 p-6 flex flex-col justify-center">
            {article.categorie && (
              <span className="inline-block w-fit text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full mb-3">
                {article.categorie}
              </span>
            )}
            <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-3">
              {article.titre}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {date && (
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="text-xs" /> {date}
                </span>
              )}
              {auteur && (
                <span className="flex items-center gap-1.5">
                  <FiUser className="text-xs" /> {auteur}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/actualites/${article.slug}`}
      className="group block rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700 hover:border-indigo-500 transition-all"
    >
      {couverture ? (
        <div className="relative w-full h-44 overflow-hidden">
          <Image
            src={couverture}
            alt={article.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="w-full h-44 bg-gray-700/50 flex items-center justify-center">
          <FiTag className="text-3xl text-gray-500" />
        </div>
      )}
      <div className="p-4">
        {article.categorie && (
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full mb-2">
            {article.categorie}
          </span>
        )}
        <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2">
          {article.titre}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {date && (
            <span className="flex items-center gap-1">
              <FiCalendar className="text-[10px]" /> {date}
            </span>
          )}
          {auteur && (
            <span className="flex items-center gap-1">
              <FiUser className="text-[10px]" /> {auteur}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
