/**
 * Composant pour injecter des données structurées JSON-LD (Schema.org)
 * pour améliorer le SEO et les rich snippets dans Google
 */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
