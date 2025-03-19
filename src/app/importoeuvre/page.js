'use client';

import { useState } from "react";

export default function Home() {
    const [chapId, setChapId] = useState("");
    const [data, setData] = useState([]);

    // Fonction pour récupérer les chapitres en fonction du chap_id
    const fetchData = async () => {
        if (!chapId) return;

        const response = await fetch(`/api/data?chap_id=${chapId}`);
        const result = await response.json();
        setData(result);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
            <h1>Rechercher un Chapitre</h1>

            <input
                type="text"
                placeholder="Entrer un chap_id (ex: 15)"
                value={chapId}
                onChange={(e) => setChapId(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
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
                }}
            >
                Rechercher
            </button>

            <ul style={{ marginTop: "20px", padding: "0", listStyle: "none" }}>
                {data.length === 0 && chapId && <p>Aucun chapitre trouvé.</p>}
                {data.map((item, index) => (
                    <li key={index} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                        <strong>Chapitre {item.chapitre}</strong> ({new Date(item.time_chap).toLocaleString()})
                        <br />
                        <a href={item.lien} target="_blank" rel="noopener noreferrer">
                            Lire le chapitre
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
