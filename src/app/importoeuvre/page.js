"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function Home() {
    const [chapId, setChapId] = useState("");
    const [data, setData] = useState([]);
    const [oeuvres, setOeuvres] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOeuvres, setFilteredOeuvres] = useState([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Vérifier si un JWT est stocké
                const jwt = localStorage.getItem("jwt");
                if (!jwt) {
                    console.error("Utilisateur non connecté.");
                    return;
                }
    
                // Faire une requête pour récupérer l'utilisateur connecté
                const response = await axios.get("https://novel-index-strapi.onrender.com/api/users/me", {
                    headers: { Authorization: `Bearer ${jwt}` },
                });
    
                if (response.data) {
                    setUser(response.data);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'utilisateur :", error);
            }
        };
    
        fetchUser();
    }, []);


    useEffect(() => {
        const fetchOeuvres = async () => {
            try {
                const response = await fetch("https://novel-index-strapi.onrender.com/api/oeuvres?populate=couverture");
                const result = await response.json();

                console.log("📊 Données reçues depuis l'API Strapi :", result);

                if (result && result.data && Array.isArray(result.data)) {
                    const oeuvresList = result.data.map(oeuvre => ({
                        titre: oeuvre.titre ?? "Titre inconnu",
                        nameurl: oeuvre.nameurl ?? "",
                        documentId: oeuvre.documentId ?? "",
                        image: oeuvre.couverture?.url ?? "https://via.placeholder.com/100x150?text=Pas+d'image"
                    }));

                    setOeuvres(oeuvresList);
                    setFilteredOeuvres(oeuvresList);
                } else {
                    console.error("🚨 Erreur : Format de données incorrect !", result);
                    setOeuvres([]);
                }
            } catch (error) {
                console.error("🚨 Erreur lors du chargement des œuvres :", error);
                setOeuvres([]);
            }
        };

        fetchOeuvres();
    }, []);

    const fetchData = async () => {
      if (!chapId) return;
  
      console.log("📢 Envoi de la requête à : /api/data?chap_id=", chapId);
  
      try {
          const response = await fetch(`/api/data?chap_id=${chapId}`);
          const result = await response.json();
  
          console.log("📨 Réponse API reçue :", result);
  
          if (Array.isArray(result)) {
              // Modifier les chapitres et trier par `time_chap`
              const orderedData = result
                  .sort((a, b) => new Date(a.time_chap) - new Date(b.time_chap))
                  .map((item, index) => {
                      let chapitreFormatted = "";
  
                      if (item.chapitre == 0.1) {
                          chapitreFormatted = "Prologue";
                      } else if (item.chapitre == 100000) {
                          chapitreFormatted = "Épilogue";
                      } else {
                          chapitreFormatted = `Chapitre ${item.chapitre}`;
                      }
  
                      return {
                          ...item,
                          order: index + 1, // Remplit la colonne avec des valeurs croissantes
                          chapitre: chapitreFormatted // Assignation propre
                      };
                  });
  
              setData(orderedData);
          } else {
              console.error("🚨 La réponse API n'est pas un tableau !", result);
              setData([]);
          }
      } catch (error) {
          console.error("🚨 Erreur lors de la requête API :", error);
          setData([]);
      }
  };
  

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredOeuvres(oeuvres);
        } else {
            const filtered = oeuvres.filter(oeuvre =>
                oeuvre.titre.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOeuvres(filtered);
        }
    }, [searchTerm, oeuvres]);

    const selectOeuvre = (oeuvre) => {
        setChapId(oeuvre.nameurl);
        setSearchTerm("");
        setFilteredOeuvres([]);
    };

    const handleChange = (index, field, value) => {
        const newData = [...data];
        newData[index][field] = value;
        setData(newData);
    };

    //importation des chapitres
    const importChapters = async () => {
      if (data.length === 0) return;
  
      setImporting(true);
      setProgress(0);
      setMessage(null);
  
      try {
          const jwt = localStorage.getItem("jwt");
  
          if (!jwt) {
              setMessage("Vous devez être connecté pour ajouter des chapitres.");
              setImporting(false);
              return;
          }
  
          // 🔹 Vérifier que l'œuvre sélectionnée existe
          const selectedOeuvre = oeuvres.find(o => o.nameurl === chapId);
          if (!selectedOeuvre) {
              setMessage("❌ Erreur : Aucune œuvre trouvée avec ce chapId.");
              setImporting(false);
              return;
          }
  
          // 🔹 Récupération des chapitres existants pour connaître le dernier `order`
          const oeuvreResponse = await axios.get(
              `https://novel-index-strapi.onrender.com/api/oeuvres/${selectedOeuvre.documentId}?populate=chapitres`,
              {
                  headers: { Authorization: `Bearer ${jwt}` },
              }
          );
  
          const chapitresExistants = oeuvreResponse.data.data.chapitres || [];
          let dernierOrder = chapitresExistants.length > 0
              ? Math.max(...chapitresExistants.map(chap => parseInt(chap.order, 10)))
              : 0;
  
          let successCount = 0;
          let errors = [];
  
          for (let i = 0; i < data.length; i++) {
              const chapter = data[i];
  
              // 🔹 Construire le bon `payload` compatible avec Strapi
              let payload = {
                  data: {
                      titre: chapter.chapitre, 
                      order: dernierOrder + i + 1, 
                      url: chapter.lien,
                      oeuvres: [selectedOeuvre.documentId], // 🔹 Associer à l'œuvre via son ID
                      users_permissions_users: user ? [user.documentId] : [] // 🔹 Associer à l'utilisateur
                  }
              };
  
              if (chapter.tome !== "0") {
                  payload.data.tome = chapter.tome;
              }
  
              try {
  
                  await axios.post("https://novel-index-strapi.onrender.com/api/chapitres", 
                      payload,  // ✅ Structure correcte `{ data: {...} }`
                      {
                          headers: {
                              Authorization: `Bearer ${jwt}`,
                              "Content-Type": "application/json",
                          },
                      }
                  );
  
                  successCount++;
                  setProgress(Math.round((successCount / data.length) * 100));
  
                  // 🌟 Pause toutes les 100 requêtes pour éviter la surcharge
                  if (successCount % 80 === 0) {
                      console.log(`🛑 Pause de 2 secondes après ${successCount} requêtes...`);
                      await new Promise(resolve => setTimeout(resolve, 4000));
                  }
              } catch (error) {
                  console.error(`❌ Erreur d'importation du chapitre ${chapter.chapitre} :`, error);
                  errors.push(`Erreur pour "${chapter.chapitre}"`);
              }
          }
  
          setImporting(false);
          setMessage(
              `${successCount} chapitres ajoutés avec succès !` + 
              (errors.length > 0 ? `\n❌ Erreurs détectées : ${errors.join(", ")}` : "")
          );
      } catch (error) {
          console.error("❌ Erreur lors de l'ajout :", error);
          setMessage("Erreur lors de l'ajout des chapitres.");
      }
  };
  
  
  
    return (
        <div style={{ padding: "20px", maxWidth: "700px", margin: "auto", color: "black", backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
            <h1 style={{ color: "black" }}>Rechercher un Chapitre</h1>

            <input
                type="text"
                placeholder="Rechercher une œuvre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    fontSize: "16px",
                    color: "black"
                }}
            />

            {filteredOeuvres.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, background: "#ddd", borderRadius: "5px", maxHeight: "300px", overflowY: "auto" }}>
                    {filteredOeuvres.map((oeuvre, index) => (
                        <li 
                            key={index} 
                            onClick={() => selectOeuvre(oeuvre)} 
                            style={{ 
                                display: "flex",
                                alignItems: "center",
                                padding: "10px", 
                                cursor: "pointer", 
                                borderBottom: "1px solid #bbb",
                                color: "black"
                            }}
                        >
                            <img 
                                src={oeuvre.image} 
                                alt={oeuvre.titre} 
                                style={{ width: "50px", height: "75px", marginRight: "10px", borderRadius: "5px" }}
                            />
                            <span>{oeuvre.titre ?? "Titre inconnu"}</span>
                        </li>
                    ))}
                </ul>
            )}

            <input
                type="text"
                placeholder="Entrer un chap_id"
                value={chapId}
                onChange={(e) => setChapId(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    fontSize: "16px",
                    color: "black"
                }}
            />

            <button
                onClick={fetchData}
                style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    borderRadius: "5px",
                }}
            >
                Rechercher
            </button>

{/* 🌟 Barre de progression visible pendant l'importation */}
{importing && (
    <div style={{ marginTop: "20px", width: "100%", background: "#ddd", height: "20px", borderRadius: "5px" }}>
        <div style={{ width: `${progress}%`, background: "#007bff", height: "100%", borderRadius: "5px" }}></div>
    </div>
)}

{/* 🌟 Bouton Importer */}
<button
    onClick={importChapters}
    disabled={importing} // Désactive le bouton pendant l'import
    style={{
        width: "100%",
        padding: "10px",
        backgroundColor: importing ? "#aaa" : "#28a745",
        color: "white",
        border: "none",
        cursor: importing ? "not-allowed" : "pointer",
        fontSize: "16px",
        borderRadius: "5px",
        marginTop: "20px"
    }}
>
    {importing ? "Importation en cours..." : "Importer"}
</button>


            <ul style={{ marginTop: "20px", padding: "0", listStyle: "none" }}>
                {data.length === 0 && chapId && <p style={{ color: "black" }}>Aucun chapitre trouvé.</p>}
                {data.map((item, index) => (
                    <li key={index} style={{ 
                        padding: "10px", 
                        borderBottom: "1px solid #ccc", 
                        color: "black", 
                        display: "flex", 
                        alignItems: "center",
                        gap: "10px"
                    }}>
                        <span style={{ width: "30px", textAlign: "center", fontWeight: "bold" }}>{item.order}</span>
                        <input 
                            type="text" 
                            value={item.chapitre} 
                            onChange={(e) => handleChange(index, "chapitre", e.target.value)}
                            style={{ 
                                width: "150px", 
                                textAlign: "center",
                                color: "black",
                                border: "1px solid #ccc"
                            }}
                        />
                        <input 
                            type="text" 
                            value={item.tome} 
                            onChange={(e) => handleChange(index, "tome", e.target.value)}
                            style={{ 
                                width: "50px", 
                                textAlign: "center",
                                color: "black",
                                border: "1px solid #ccc"
                            }}
                        />
<textarea
    value={item.lien} 
    onChange={(e) => handleChange(index, "lien", e.target.value)}
    style={{
        width: "500px",
        color: "black",
        border: "1px solid #ccc",
        resize: "vertical", // Permet à l'utilisateur d'agrandir la zone
        whiteSpace: "pre-wrap", // Forcer le retour à la ligne
        wordWrap: "break-word", // Couper les longues URL
        minHeight: "50px" // Taille minimale
    }}
/>


                    </li>
                ))}
            </ul>
        </div>
    );
}
