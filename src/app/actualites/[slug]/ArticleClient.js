"use client";

import Link from "next/link";
import Image from "next/image";
import DOMPurify from "dompurify";
import { FiHome, FiChevronRight, FiCalendar, FiUser, FiTag, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import TemplateSortiesJour from "../TemplateSortiesJour";
import TemplateRecapSemaine from "../TemplateRecapSemaine";
import TemplateBilanMois from "../TemplateBilanMois";
import TemplateNouvellesOeuvres from "../TemplateNouvellesOeuvres";

export default function ArticleClient({ article, templateData, adjacent, apiUrl }) {
  // Rendu template pour les articles auto-générés
  if (templateData) {
    if (templateData._type === "recap-semaine") {
      return <TemplateRecapSemaine preloadedData={templateData} />;
    }
    if (templateData._type === "recap-mois") {
      return <TemplateBilanMois preloadedData={templateData} />;
    }
    if (templateData._type === "nouvelles-oeuvres") {
      return <TemplateNouvellesOeuvres preloadedData={templateData} />;
    }
    return <TemplateSortiesJour preloadedData={templateData} />;
  }

  const couverture = article.couverture?.url
    ? (article.couverture.url.startsWith("http") ? article.couverture.url : `${apiUrl}${article.couverture.url}`)
    : null;

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const auteur = article.auteur?.username || article.auteur?.email || null;
  const tags = article.tags || [];
  const oeuvresLiees = article.oeuvres_liees || [];

  return (
    <div className="relative bg-gray-900 text-white min-h-screen">
      {/* Breadcrumb */}
      <nav
        aria-label="Fil d'Ariane"
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-2"
      >
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li>
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <FiHome className="text-xs" /> Accueil
            </Link>
          </li>
          <li><FiChevronRight className="text-xs" /></li>
          <li>
            <Link href="/actualites" className="hover:text-white transition-colors">
              Actualités
            </Link>
          </li>
          <li><FiChevronRight className="text-xs" /></li>
          <li className="text-white font-medium truncate max-w-[200px]">{article.titre}</li>
        </ol>
      </nav>

      {/* Article */}
      <article className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Header */}
        <header className="mb-8">
          {article.categorie && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full mb-4">
              {article.categorie}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {article.titre}
          </h1>
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
        </header>

        {/* Couverture */}
        {couverture && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <Image
              src={couverture}
              alt={`Couverture de l'article ${article.titre}`}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Contenu */}
        {article.contenu && (
          <div
            className="text-gray-300 leading-relaxed"
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.contenu),
            }}
          />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-gray-800">
            <FiTag className="text-gray-400" />
            {tags.map((tag) => (
              <span
                key={tag.id || tag.titre}
                className="bg-gray-800/60 text-gray-300 border border-gray-700 px-3 py-1 rounded-full text-sm"
                title={tag.description || undefined}
              >
                {tag.titre}
              </span>
            ))}
          </div>
        )}

        {/* Oeuvres liées */}
        {oeuvresLiees.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Oeuvres liées</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {oeuvresLiees.map((oeuvre) => {
                const oeuvreCover = oeuvre.couverture?.url
                  ? (oeuvre.couverture.url.startsWith("http") ? oeuvre.couverture.url : `${apiUrl}${oeuvre.couverture.url}`)
                  : null;
                return (
                  <Link
                    key={oeuvre.documentId || oeuvre.id}
                    href={`/oeuvre/${oeuvre.documentId}-${(oeuvre.titre || "").toLowerCase().replace(/\s+/g, "-")}`}
                    className="group rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700 hover:border-indigo-500 transition-all"
                  >
                    {oeuvreCover ? (
                      <div className="relative w-full h-32 overflow-hidden">
                        <Image
                          src={oeuvreCover}
                          alt={`Couverture de ${oeuvre.titre}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-700/50" />
                    )}
                    <p className="p-2 text-sm text-white font-medium line-clamp-2 group-hover:text-indigo-300 transition-colors">
                      {oeuvre.titre}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation prev/next */}
        <div className="flex items-stretch gap-4 mt-12 pt-6 border-t border-gray-800">
          {adjacent.prev ? (
            <Link
              href={`/actualites/${adjacent.prev.slug}`}
              className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-indigo-500 transition-all group"
            >
              <FiArrowLeft className="text-xl text-gray-400 group-hover:text-indigo-400 transition-colors shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Précédent</p>
                <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                  {adjacent.prev.titre}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {adjacent.next ? (
            <Link
              href={`/actualites/${adjacent.next.slug}`}
              className="flex-1 flex items-center justify-end gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-indigo-500 transition-all group text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Suivant</p>
                <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                  {adjacent.next.titre}
                </p>
              </div>
              <FiArrowRight className="text-xl text-gray-400 group-hover:text-indigo-400 transition-colors shrink-0" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </article>
    </div>
  );
}
