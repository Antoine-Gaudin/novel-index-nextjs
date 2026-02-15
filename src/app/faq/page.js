import JsonLd from "@/app/components/JsonLd";
import Link from "next/link";

export const metadata = {
  title: "FAQ - Questions fréquentes - Novel-Index",
  description:
    "Toutes les réponses à vos questions sur Novel-Index : comment ça marche, comment suivre vos light novels, web novels, manga et manhwa traduits en français.",
  alternates: {
    canonical: "https://www.novel-index.com/faq",
  },
  openGraph: {
    title: "FAQ - Questions fréquentes - Novel-Index",
    description:
      "Toutes les réponses à vos questions sur Novel-Index : fonctionnement, inscription, traductions françaises de light novels et web novels.",
    url: "https://www.novel-index.com/faq",
    siteName: "Novel-Index",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FAQ - Novel-Index",
    description:
      "Réponses aux questions fréquentes sur Novel-Index, la plateforme d'indexation de traductions françaises.",
  },
};

const faqItems = [
  {
    question: "Qu'est-ce que Novel-Index ?",
    answer:
      "Novel-Index est une plateforme collaborative francophone qui indexe et référence les traductions françaises de Light Novels, Web Novels, Manga, Manhwa et Webtoons. Nous ne stockons aucun contenu traduit : nous redirigeons les lecteurs directement vers les sites des teams de traduction.",
  },
  {
    question: "Novel-Index est-il gratuit ?",
    answer:
      "Oui, Novel-Index est entièrement gratuit. La création de compte, la consultation du catalogue, les abonnements aux œuvres et les notifications sont accessibles sans aucun frais.",
  },
  {
    question: "C'est quoi un Light Novel ?",
    answer:
      "Un Light Novel (ライトノベル) est un roman japonais généralement court, souvent accompagné d'illustrations de style manga. Ils sont à l'origine de nombreux anime et manga populaires. Sur Novel-Index, vous trouverez des centaines de Light Novels traduits en français par des teams bénévoles.",
  },
  {
    question: "C'est quoi un Web Novel ?",
    answer:
      "Un Web Novel est un roman publié en ligne, chapitre par chapitre, par un auteur. Contrairement aux Light Novels qui sont édités par des maisons d'édition, les Web Novels sont souvent auto-publiés sur des plateformes comme Syosetu (Japon), Munpia (Corée) ou Qidian (Chine). Beaucoup de Light Novels célèbres ont commencé comme Web Novels.",
  },
  {
    question: "Quelle est la différence entre Manga, Manhwa et Webtoon ?",
    answer:
      "Le Manga est une bande dessinée japonaise, lue de droite à gauche. Le Manhwa est une bande dessinée coréenne, lue de gauche à droite. Le Webtoon est un format numérique, généralement coréen, conçu pour être lu verticalement sur smartphone. Novel-Index référence les traductions françaises de ces trois formats.",
  },
  {
    question: "Comment suivre une œuvre et être notifié des nouveaux chapitres ?",
    answer:
      "Créez un compte gratuit, puis rendez-vous sur la page d'une œuvre et cliquez sur le bouton \"S'abonner\". Vous verrez les nouvelles sorties directement sur votre page d'accueil et dans votre bibliothèque personnelle.",
  },
  {
    question: "Comment fonctionne la redirection vers les chapitres ?",
    answer:
      "Quand vous cliquez sur un chapitre dans Novel-Index, vous êtes redirigé directement vers le site de la team de traduction qui l'a publié. Novel-Index sert de pont entre les lecteurs et les traducteurs, sans héberger le contenu.",
  },
  {
    question: "Je suis traducteur, comment référencer mes œuvres ?",
    answer:
      "Créez un compte sur Novel-Index, puis rendez-vous dans votre espace team pour ajouter vos œuvres et vos chapitres. L'indexation est collaborative : vous gardez le contrôle total sur vos pages et vos liens. Pour toute question, rejoignez notre Discord.",
  },
  {
    question: "Les traductions sont-elles officielles ?",
    answer:
      "Novel-Index référence principalement des traductions réalisées par des fans bénévoles (scantrad/fantrad). Nous référençons aussi les sorties officielles quand elles existent. Chaque page d'œuvre indique clairement la team de traduction responsable.",
  },
  {
    question: "Comment signaler un problème ou un lien mort ?",
    answer:
      "Si vous trouvez un lien cassé, une erreur d'information ou un contenu inapproprié, vous pouvez nous le signaler via notre serveur Discord. Notre équipe de modération traite les signalements rapidement.",
  },
];

export default function FAQ() {
  // Schema JSON-LD FAQPage pour les rich snippets Google
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://www.novel-index.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: "https://www.novel-index.com/faq",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Questions fréquentes
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur Novel-Index, la plateforme
            d&apos;indexation de traductions françaises de Light Novels, Web
            Novels, Manga, Manhwa et Webtoons.
          </p>
        </div>

        {/* Liste FAQ */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-lg font-semibold text-white hover:bg-gray-700/50 transition select-none">
                <span>{item.question}</span>
                <svg
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-gray-300 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        {/* CTA contact */}
        <div className="mt-12 text-center bg-gray-800/40 border border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Vous avez d&apos;autres questions ?
          </h2>
          <p className="text-gray-400 mb-6">
            Rejoignez notre communauté sur Discord pour échanger avec
            l&apos;équipe et les autres utilisateurs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://discord.gg/kgP6eB3Crd"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg hover:shadow-indigo-500/25"
            >
              Rejoindre le Discord
            </a>
            <Link
              href="/Oeuvres"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Explorer le catalogue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
