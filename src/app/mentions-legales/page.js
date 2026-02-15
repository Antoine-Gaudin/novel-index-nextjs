import JsonLd from "@/app/components/JsonLd";

export const metadata = {
  title: "Mentions légales - Novel-Index",
  description: "Mentions légales du site Novel-Index, plateforme d'indexation de traductions de webnovels, light novels, manhwa et manga.",
  alternates: {
    canonical: "https://www.novel-index.com/mentions-legales",
  },
  openGraph: {
    title: "Mentions légales - Novel-Index",
    description: "Mentions légales du site Novel-Index, plateforme d'indexation de traductions de webnovels, light novels, manhwa et manga.",
    url: "https://www.novel-index.com/mentions-legales",
    siteName: "Novel-Index",
    locale: "fr_FR",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Mentions légales - Novel-Index",
    description: "Mentions légales du site Novel-Index, plateforme d'indexation de traductions.",
  },
};

export default function MentionsLegales() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://www.novel-index.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Mentions légales",
        "item": "https://www.novel-index.com/mentions-legales"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Mentions légales</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Éditeur du site</h2>
          <p className="text-gray-300 leading-relaxed">
            Le site <strong>Novel-Index</strong> (www.novel-index.com) est un projet communautaire
            d&apos;indexation de traductions de webnovels, light novels, manhwa et manga en français.
          </p>
          {/* TODO: Compléter avec les informations de l'éditeur */}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Hébergement</h2>
          <p className="text-gray-300 leading-relaxed">
            {/* TODO: Compléter avec les informations de l'hébergeur */}
            Les informations relatives à l&apos;hébergeur seront ajoutées prochainement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Propriété intellectuelle</h2>
          <p className="text-gray-300 leading-relaxed">
            Novel-Index est une plateforme d&apos;indexation et de redirection. Les contenus référencés
            (oeuvres, traductions) restent la propriété de leurs auteurs et traducteurs respectifs.
            Novel-Index ne stocke ni ne distribue aucun contenu protégé par le droit d&apos;auteur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Contact</h2>
          <p className="text-gray-300 leading-relaxed">
            Pour toute question ou demande, vous pouvez nous contacter via notre{" "}
            <a
              href="https://discord.gg/kgP6eB3Crd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              serveur Discord
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
