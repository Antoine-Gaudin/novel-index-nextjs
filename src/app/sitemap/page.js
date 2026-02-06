import Link from "next/link";
import { slugify } from "@/utils/slugify";

async function fetchData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [oeuvresRes, tagsRes, genresRes] = await Promise.all([
    fetch(`${apiUrl}/api/oeuvres?pagination[limit]=1000`, { next: { revalidate: 3600 } }),
    fetch(`${apiUrl}/api/tags?pagination[limit]=200`, { next: { revalidate: 3600 } }),
    fetch(`${apiUrl}/api/genres?pagination[limit]=200`, { next: { revalidate: 3600 } }),
  ]);

  const [oeuvresData, tagsData, genresData] = await Promise.all([
    oeuvresRes.json(),
    tagsRes.json(),
    genresRes.json(),
  ]);

  return {
    oeuvres: oeuvresData.data || [],
    tags: tagsData.data || [],
    genres: genresData.data || [],
  };
}

export default async function SitemapPage() {
  const { oeuvres, tags, genres } = await fetchData();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Plan du site</h1>
        <p className="text-gray-400 mb-8">
          Retrouvez tous les liens et pages disponibles sur Novel-Index
        </p>

        {/* Pages principales */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Pages principales</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-gray-300 hover:text-blue-400 transition-colors">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/Oeuvres" className="text-gray-300 hover:text-blue-400 transition-colors">
                Toutes les oeuvres
              </Link>
            </li>
            <li>
              <Link href="/tags-genres/tag" className="text-gray-300 hover:text-blue-400 transition-colors">
                Tous les tags
              </Link>
            </li>
            <li>
              <Link href="/tags-genres/genre" className="text-gray-300 hover:text-blue-400 transition-colors">
                Tous les genres
              </Link>
            </li>
          </ul>
        </section>

        {/* Genres */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">
            Genres ({genres.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {genres.map((genre) => (
              <Link
                key={genre.documentId}
                href={`/tags-genres/genre/${slugify(genre.titre)}`}
                className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                {genre.titre}
              </Link>
            ))}
          </div>
        </section>

        {/* Tags */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">
            Tags ({tags.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.documentId}
                href={`/tags-genres/tag/${slugify(tag.titre)}`}
                className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                {tag.titre}
              </Link>
            ))}
          </div>
        </section>

        {/* Oeuvres */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">
            Oeuvres ({oeuvres.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {oeuvres.map((oeuvre) => (
              <Link
                key={oeuvre.documentId}
                href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`}
                className="text-gray-300 hover:text-blue-400 transition-colors text-sm truncate"
                title={oeuvre.titre}
              >
                {oeuvre.titre}
              </Link>
            ))}
          </div>
        </section>

        {/* Informations */}
        <section className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            Total : {oeuvres.length} oeuvres, {genres.length} genres, {tags.length} tags
          </p>
        </section>
      </div>
    </div>
  );
}
