import Link from "next/link";
import { slugify } from "@/utils/slugify";

// Composant unifié pour afficher tags & genres de manière cohérente.
// Style B : pills pleins en dégradé.
//   - Genre : rose/magenta
//   - Tag   : indigo/violet
// Tailles : "sm" | "md" (défaut) | "lg"
// Avec `count` : ajoute un badge compteur intégré (style "populaires").

const SIZES = {
  sm: "px-2.5 py-0.5 text-xs gap-1.5",
  md: "px-3 py-1 text-sm gap-2",
  lg: "px-4 py-1.5 text-sm gap-2",
};

const VARIANTS = {
  genre:
    "bg-gradient-to-r from-pink-500/90 to-rose-600/90 hover:from-pink-400 hover:to-rose-500 text-white shadow-sm shadow-pink-900/30 ring-1 ring-pink-400/20",
  tag:
    "bg-gradient-to-r from-indigo-500/90 to-violet-600/90 hover:from-indigo-400 hover:to-violet-500 text-white shadow-sm shadow-indigo-900/30 ring-1 ring-indigo-400/20",
};

const COUNT_VARIANTS = {
  genre: "bg-pink-900/40 text-pink-100",
  tag: "bg-indigo-900/40 text-indigo-100",
};

const PREFIX = {
  genre: "/tags-genres/genre/",
  tag: "/tags-genres/tag/",
};

export default function TaxonomyChip({
  type = "genre",        // "genre" | "tag"
  label,                  // texte affiché
  slug,                   // slug optionnel (sinon dérivé de label)
  href,                   // href explicite optionnel (sinon dérivé)
  size = "md",
  count = null,           // si défini, affiche un badge compteur
  className = "",
  ...rest
}) {
  if (!label) return null;
  const finalHref = href || `${PREFIX[type] || PREFIX.genre}${slug || slugify(label)}`;
  const sizeCls = SIZES[size] || SIZES.md;
  const variantCls = VARIANTS[type] || VARIANTS.genre;

  return (
    <Link
      href={finalHref}
      className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-md ${sizeCls} ${variantCls} ${className}`}
      {...rest}
    >
      <span className="truncate">{label}</span>
      {count !== null && count !== undefined && (
        <span
          className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${COUNT_VARIANTS[type] || COUNT_VARIANTS.genre}`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
