import Link from "next/link";
import { FaXTwitter, FaDiscord } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 mt-8" aria-label="Pied de page">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Colonne 1 - Marque & description */}
          <div>
            <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
              Novel-Index
            </Link>
            <p className="mt-3 text-sm leading-relaxed">
              Plateforme collaborative d&apos;indexation de traductions de webnovels, light novels, manhwa et manga en français.
            </p>
          </div>

          {/* Colonne 2 - Navigation */}
          <nav aria-label="Navigation du pied de page">
            <h3 className="text-white font-semibold mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/Oeuvres" className="hover:text-white transition-colors">
                  Catalogue des oeuvres
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="hover:text-white transition-colors">
                  Plan du site
                </Link>
              </li>
            </ul>
          </nav>

          {/* Colonne 3 - Catégories */}
          <nav aria-label="Catégories">
            <h3 className="text-white font-semibold mb-3">Catégories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tags-genres/genre" className="hover:text-white transition-colors">
                  Tous les genres
                </Link>
              </li>
              <li>
                <Link href="/tags-genres/tag" className="hover:text-white transition-colors">
                  Tous les tags
                </Link>
              </li>
            </ul>
          </nav>

          {/* Colonne 4 - Légal & Réseaux sociaux */}
          <div>
            <h3 className="text-white font-semibold mb-3">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-de-confidentialite" className="hover:text-white transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a
                href="https://x.com/Index_Novel"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Suivez-nous sur X (Twitter)"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/kgP6eB3Crd"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Rejoignez notre Discord"
              >
                <FaDiscord className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Barre de copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Novel-Index. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
