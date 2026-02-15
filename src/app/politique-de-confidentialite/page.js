import JsonLd from "@/app/components/JsonLd";

export const metadata = {
  title: "Politique de confidentialité - Novel-Index",
  description: "Politique de confidentialité du site Novel-Index. Informations sur la collecte et le traitement des données personnelles.",
  alternates: {
    canonical: "https://www.novel-index.com/politique-de-confidentialite",
  },
  openGraph: {
    title: "Politique de confidentialité - Novel-Index",
    description: "Politique de confidentialité du site Novel-Index. Informations sur la collecte et le traitement des données personnelles.",
    url: "https://www.novel-index.com/politique-de-confidentialite",
    siteName: "Novel-Index",
    locale: "fr_FR",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Politique de confidentialité - Novel-Index",
    description: "Politique de confidentialité du site Novel-Index.",
  },
};

export default function PolitiqueDeConfidentialite() {
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
        "name": "Politique de confidentialité",
        "item": "https://www.novel-index.com/politique-de-confidentialite"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Politique de confidentialité</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Collecte des données</h2>
          <p className="text-gray-300 leading-relaxed">
            Novel-Index collecte les données suivantes lors de la création de votre compte :
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 space-y-1">
            <li>Adresse e-mail</li>
            <li>Nom d&apos;utilisateur</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-3">
            Ces données sont nécessaires au fonctionnement de votre compte et à
            l&apos;utilisation des fonctionnalités du site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Utilisation des cookies</h2>
          <p className="text-gray-300 leading-relaxed">
            Novel-Index utilise des cookies techniques nécessaires au bon fonctionnement du site
            (authentification, préférences). Nous utilisons également Google Analytics pour analyser
            le trafic du site de manière anonyme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Partage des données</h2>
          <p className="text-gray-300 leading-relaxed">
            Vos données personnelles ne sont ni vendues, ni partagées avec des tiers, à
            l&apos;exception des services techniques nécessaires au fonctionnement du site
            (hébergement, analyse de trafic).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Vos droits (RGPD)</h2>
          <p className="text-gray-300 leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            des droits suivants :
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-3 space-y-1">
            <li>Droit d&apos;accès à vos données personnelles</li>
            <li>Droit de rectification de vos données</li>
            <li>Droit à l&apos;effacement de vos données</li>
            <li>Droit à la portabilité de vos données</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-3">
            Pour exercer ces droits, contactez-nous via notre{" "}
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

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Modifications</h2>
          <p className="text-gray-300 leading-relaxed">
            Cette politique de confidentialité peut être modifiée à tout moment.
            Les utilisateurs seront informés de tout changement majeur.
          </p>
        </section>
      </div>
    </div>
  );
}
