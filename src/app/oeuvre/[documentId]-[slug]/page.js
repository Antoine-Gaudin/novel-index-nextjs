"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import AffiChapitre from "../../components/Affichapitre";
import Commentaire from "../../components/commentaire";
import DOMPurify from "dompurify";

const OeuvrePage = () => {
  const pathname = usePathname();
  const parts = pathname.split("/");
  const documentId = parts[2].split("-")[0];
  const [oeuvre, setOeuvre] = useState(null);
  const [chapitres, setChapitres] = useState([]); // Liste des chapitres
  const [selectedChapter, setSelectedChapter] = useState(null); // Chapitre sélectionné pour le pop-up
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);

  useEffect(() => {
    const fetchOeuvre = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres/${documentId}?populate=couverture`
        );
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        setOeuvre(data.data);

        // ✅ Mise à jour dynamique du title et meta description
        if (data.data) {
          document.title = `${data.data.titre} ${data.data.type} fr`;

          let metaDescription = document.querySelector(
            "meta[name='description']"
          );
          if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
          }
          metaDescription.setAttribute(
            "content",
            data.data.synopsis || "Découvrez nos œuvres littéraires."
          );

          // ✅ Ajout canonique
          let linkCanonical = document.querySelector("link[rel='canonical']");
          if (!linkCanonical) {
            linkCanonical = document.createElement("link");
            linkCanonical.setAttribute("rel", "canonical");
            document.head.appendChild(linkCanonical);
          }

          const titreAvecTirets = data.data.titre.replace(/ /g, "-");

          linkCanonical.setAttribute(
            "href",
            `https://novel-index.com/oeuvre/${data.data.documentId}-${titreAvecTirets}`
          );
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'œuvre :", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchChapitres = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres/${documentId}?populate=chapitres`
        );
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        const sortedChapitres = data.data.chapitres.sort(
          (a, b) => a.order - b.order
        ); // Tri croissant
        setChapitres(sortedChapitres);
      } catch (err) {
        console.error("Erreur lors de la récupération des chapitres :", err);
      }
    };

    if (documentId) {
      fetchOeuvre();
      fetchChapitres();
    }
  }, [documentId]);

  useEffect(() => {
    const checkAbonnement = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

      if (!jwt || !userId || !oeuvre?.documentId) {
        console.warn(
          "❌ Paramètres manquants pour checkAbonnement, annulation."
        );
        return;
      }

      const url = `${apiUrl}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${oeuvre.documentId}&filters[users_permissions_users][documentId][$eq]=${userId}`;

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await res.json();

        const abonnement = data?.data?.[0];
        if (abonnement) {
          setIsSubscribed(true);
          setSubscriptionId(abonnement.documentId);
        } else {
          setIsSubscribed(false);
          setSubscriptionId(null);
        }
      } catch (err) {
        console.error("❌ Erreur pendant checkAbonnement :", err);
      }
    };

    if (oeuvre?.documentId) {
      checkAbonnement();
    }
  }, [oeuvre?.documentId]);

  useEffect(() => {
    const updateLastChecked = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

      if (!jwt || !userId || !oeuvre?.documentId || !subscriptionId) return;

      try {
        await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            data: {
              lastChecked: new Date().toISOString(),
            },
          }),
        });
      } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de lastChecked :", err);
      }
    };

    if (subscriptionId) {
      updateLastChecked();
    }
  }, [subscriptionId]);

  const handleSubscribe = async () => {
    const jwt = localStorage.getItem("jwt");
    const userInfo = Cookies.get("userInfo");
    const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

    const res = await fetch(`${apiUrl}/api/checkoeuvretimes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        data: {
          oeuvres: [oeuvre.documentId],
          users_permissions_users: [userId],
          lastChecked: new Date().toISOString(),
          notification: true,
          archived: false,
        },
      }),
    });

    const data = await res.json();
    setIsSubscribed(true);
    setSubscriptionId(data.data.documentId);
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionId) return;

    const jwt = localStorage.getItem("jwt");
    await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    setIsSubscribed(false);
    setSubscriptionId(null);
  };

  if (loading)
    return <p className="text-center text-gray-400 mt-10">Chargement...</p>;
  if (!oeuvre)
    return <p className="text-center text-red-500 mt-10">Œuvre introuvable.</p>;

  // Gestion de la redirection avec pop-up
  const handleReadClick = (type) => {
    if (!chapitres.length) return;

    const selectedChapitre =
      type === "first"
        ? chapitres[0] // Premier chapitre
        : chapitres[chapitres.length - 1]; // Dernier chapitre

    setSelectedChapter(selectedChapitre);
  };

  // Fermer le pop-up
  const closePopup = () => {
    setSelectedChapter(null);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Bannière */}
      <div
        className="relative h-80 w-full bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(17, 24, 39, 0.6), rgba(17, 24, 39, 1)), url('/images/heroheader.webp')`,
        }}
      ></div>

      {/* Contenu Principal remonté */}
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative top-[-100px] z-10">
        {/* Présentation de l'œuvre */}
        <div className="flex flex-col md:flex-row items-center md:items-start space-x-0 md:space-x-8">
          {/* Image de couverture */}
          {oeuvre.couverture?.url ? (
            <img
              src={`${oeuvre.couverture.url}`}
              alt={oeuvre.titre || "Image non disponible"}
              className="w-64 h-96 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-64 h-96 bg-gray-700 flex items-center justify-center rounded-lg text-gray-400">
              Pas de couverture
            </div>
          )}

          {/* Informations principales */}
          <div className="flex flex-col space-y-4 text-center md:text-left">
            <h1 className="text-4xl font-bold">
              {oeuvre.titre || "Titre non disponible"}
            </h1>
            <p className="text-gray-300 text-lg">
              <strong>
                {oeuvre.auteur || "Auteur inconnu"} (Auteur),{" "}
                {oeuvre.traduction || "Traduction inconnue"} (Traduction)
              </strong>
            </p>

            {/* Boutons d'action */}
            <div className="flex space-x-4">
              <button
                className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 text-lg"
                onClick={() => handleReadClick("first")}
              >
                Commencer à lire
              </button>
              <button
                className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 text-lg"
                onClick={() => handleReadClick("last")}
              >
                Lire le dernier chapitre
              </button>
              <button
                className={`px-6 py-3 text-white rounded-md shadow text-lg ${
                  isSubscribed
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              >
                {isSubscribed ? "Se désabonner" : "S’abonner"}
              </button>
            </div>
          </div>
        </div>

        {/* Fenêtre Pop-up */}
        {selectedChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
              <h2 className="text-2xl font-bold">Confirmation</h2>
              <p>
                Vous êtes sur le point d'être redirigé vers le chapitre
                sélectionné.
              </p>
              <p>
                <strong>Chapitre :</strong>{" "}
                {selectedChapter.titre || "Titre non disponible"}
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700"
                  onClick={closePopup}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700"
                  onClick={() => {
                    window.open(selectedChapter.url, "_blank");
                    closePopup();
                  }}
                >
                  Continuer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="flex flex-wrap gap-4">
          {oeuvre.titrealt && (
            <span className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm">
              Titre alternatif : {oeuvre.titrealt}
            </span>
          )}
          {oeuvre.categorie && (
            <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
              Catégorie : {oeuvre.categorie}
            </span>
          )}
          {(oeuvre.licence === true ||
            oeuvre.licence === false ||
            oeuvre.licence === null) && (
            <span
              className={`${
                oeuvre.licence ? "bg-green-600" : "bg-red-600"
              } text-white px-3 py-1 rounded-md text-sm`}
            >
              {oeuvre.licence ? "Licencié" : "Non licencié"}
            </span>
          )}
          {oeuvre.langage && (
            <span className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm">
              Langage : {oeuvre.langage}
            </span>
          )}
          {oeuvre.etat && (
            <span className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
              État : {oeuvre.etat}
            </span>
          )}
          {oeuvre.type && (
            <span className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
              type : {oeuvre.type}
            </span>
          )}
          {oeuvre.annee && (
            <span className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
              Année : {oeuvre.annee}
            </span>
          )}
        </div>

        <div
          style={{ whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              oeuvre.synopsis.replace(/\\r\\n|\\n|\\r/g, "<br>")
            ),
          }}
        ></div>

        {/* Chapitres et Achats */}
        <div className="p-6 space-y-4">
          <AffiChapitre
            documentId={oeuvre.documentId}
            licence={oeuvre.licence}
          />
        </div>

        {/* Section Commentaires */}
        <div className="p-6 space-y-4">
          <Commentaire oeuvre={oeuvre} />
        </div>
      </div>
    </div>
  );
};

export default OeuvrePage;
