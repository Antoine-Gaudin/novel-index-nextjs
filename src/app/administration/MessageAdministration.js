"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const MessageAdministration = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const jwt = localStorage.getItem("jwt");
        const response = await axios.get("https://novel-index-strapi.onrender.com/api/administrations", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        setMessages(response.data.data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des messages :", err);
        setError("Erreur lors de la récupération des messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleDelete = async (documentId) => {
    try {
      const jwt = localStorage.getItem("jwt");
      await axios.delete(`https://novel-index-strapi.onrender.com/api/administrations/${documentId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.documentId !== documentId)
      );
    } catch (err) {
      console.error("Erreur lors de la suppression du message :", err);
      alert("Une erreur est survenue lors de la suppression.");
    }
  };

  return (
    <div className="w-full bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Messages d'administration</h2>
      {loading && <p className="text-yellow-400 text-center">Chargement des messages...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Liste des messages */}
      {!loading && !error && !selectedMessage && (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li
              key={message.documentId}
              className="p-4 bg-gray-700 rounded-lg shadow-md space-y-2"
            >
              <h3
                className="text-lg font-semibold cursor-pointer hover:underline"
                onClick={() => setSelectedMessage(message)}
              >
                {message.titre}
              </h3>
              <div className="text-sm flex justify-between items-center">
                <span className="text-gray-400">Origine : {message.origine}</span>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 rounded ${
                      message.signalement ? "bg-red-600 text-white" : "bg-gray-600 text-gray-200"
                    }`}
                  >
                    {message.signalement ? "Signalé" : "Non signalé"}
                  </span>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleDelete(message.documentId)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Détails du message sélectionné */}
      {selectedMessage && (
        <div className="p-4 bg-gray-700 rounded-lg shadow-md space-y-4">
          <button
            className="mb-4 py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={() => setSelectedMessage(null)}
          >
            Retour à la liste
          </button>
          <h3 className="text-xl font-bold">{selectedMessage.titre}</h3>
          <p className="text-sm text-gray-400 whitespace-pre-line">{selectedMessage.contenu}</p>
          <div className="text-sm text-gray-400">
            <p>Origine : {selectedMessage.origine}</p>
            <p>
              Signalement :{" "}
              {selectedMessage.signalement ? (
                <span className="text-red-500">Oui</span>
              ) : (
                <span className="text-green-500">Non</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageAdministration;
