"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/slugify";

const AbonnementCard = ({ abonnement }) => {
  const router = useRouter();
  const oeuvre = abonnement.oeuvres?.[0];
  const chapitres = abonnement.chapitres || [];
  const lastCheckedDate = new Date(abonnement.lastChecked);
  const nouveauxChapitres = chapitres.filter(
    (ch) => new Date(ch.createdAt) > lastCheckedDate
  );
  const nbNouveaux = nouveauxChapitres.length;

  return (
    <div
      className="bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
      onClick={() => {
        if (oeuvre) {
          const titreSlug = slugify(oeuvre.titre);
          router.push(`/oeuvre/${oeuvre.documentId}-${titreSlug}`);
        }
      }}
    >
      {oeuvre?.couverture?.url ? (
        <Image
          src={oeuvre.couverture.url}
          alt={oeuvre.titre}
          width={300}
          height={192}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
          Pas de visuel
        </div>
      )}
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-white">
          {oeuvre?.titre || "Sans titre"}
        </h2>
        <p className="text-sm text-gray-400">
          Dernier acc&egrave;s :{" "}
          {abonnement.lastChecked
            ? new Date(abonnement.lastChecked).toLocaleString("fr-FR")
            : "Jamais"}
        </p>
        {nbNouveaux > 0 ? (
          <p className="text-sm text-green-400 font-semibold">
            {nbNouveaux} nouveau{nbNouveaux > 1 ? "x" : ""} chapitre
            {nbNouveaux > 1 ? "s" : ""} depuis votre visite
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            Vous &ecirc;tes &agrave; jour sur cette oeuvre
          </p>
        )}
      </div>
    </div>
  );
};

export default AbonnementCard;
