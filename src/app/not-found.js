import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold mb-2 text-blue-500">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page introuvable</h2>
        <p className="text-gray-400 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/Oeuvres"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
          >
            Catalogue des œuvres
          </Link>
          <Link
            href="/actualites"
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors inline-block"
          >
            Actualités
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <Link href="/Teams" className="hover:text-gray-300 transition-colors">Teams</Link>
          <Link href="/tags-genres/genre" className="hover:text-gray-300 transition-colors">Genres</Link>
          <Link href="/tags-genres/tag" className="hover:text-gray-300 transition-colors">Tags</Link>
          <Link href="/faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
        </div>
      </div>
    </div>
  );
}
