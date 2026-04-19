import TeamsClient from "./TeamsClient";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;

export const metadata = {
  title: "Teams de Traduction - Novel-Index",
  description:
    "Découvrez toutes les teams de traduction référencées sur Novel-Index. Light Novels, Web Novels, Manga, Manhwa et Webtoons traduits en français.",
  keywords: [
    "teams traduction",
    "traducteurs",
    "light novel français",
    "web novel français",
    "scan français",
    "novel-index",
  ],
};

function canDisplay(team) {
  return !!team.titre?.trim() && !!team.description?.trim();
}

async function fetchTeams() {
  try {
    const res = await fetch(
      `${STRAPI}/api/teams?populate[0]=couverture&populate[1]=oeuvres&populate[2]=teamliens&sort=titre:asc`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function TeamsPage() {
  const allTeams = await fetchTeams();
  const displayableTeams = allTeams.filter(canDisplay);

  const stats = {
    total: allTeams.length,
    displayed: displayableTeams.length,
    hidden: allTeams.length - displayableTeams.length,
  };

  return <TeamsClient initialTeams={displayableTeams} stats={stats} />;
}
