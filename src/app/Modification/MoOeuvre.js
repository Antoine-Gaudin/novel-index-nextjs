"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import FormulaireModificationOeuvre from "../components/FormMoOeuvre"; // ✅ avec un O majuscule


const MoOeuvre = ({ user, oeuvre }) => {
  const [oeuvreData, setOeuvreData] = useState({});
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  const excludedFields = [
    "publishedAt",
    "updatedAt",
    "createdAt",
    "id",
    "documentId",
    "chapitres",
  ];

  useEffect(() => {

  
    const fetchOeuvre = async () => {
      const jwt = localStorage.getItem("jwt");

  
      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=couverture`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      const data = response.data.data;
      setOeuvreData(data || {});
  
      setPreview(data?.couverture?.url || null);

  
    };
  
    fetchOeuvre();
  }, [oeuvre]);
  

  const handleOeuvreChange = (e) => {
    const { name, value } = e.target;
    setOeuvreData({ ...oeuvreData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
  
      setOeuvreData((prev) => ({
        ...prev,
        nouvelleCouverture: file, // ⬅️ on garde le fichier ici (et pas dans "couverture")
      }));
    }
  };
  
  

  const handleSaveOeuvre = async () => {
    try {
      const jwt = localStorage.getItem("jwt");
  
      // 1. Préparer FormData
      const formData = new FormData();
  
      // 2. Upload image séparément si nouvelle
      if (oeuvreData.nouvelleCouverture instanceof File) {
        const imageForm = new FormData();
        imageForm.append("files", oeuvreData.nouvelleCouverture);
  
        const uploadRes = await axios.post(
          "https://novel-index-strapi.onrender.com/api/upload",
          imageForm,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );
  
        const uploadedImageId = uploadRes.data[0]?.id;
  
        if (uploadedImageId) {
          formData.append("data[couverture]", uploadedImageId);
        }
      }
  
      // 3. Ajoute les champs texte sauf les exclus
      const filteredOeuvreData = Object.keys(oeuvreData)
        .filter(
          (key) =>
            !excludedFields.includes(key) &&
            key !== "couverture" &&
            key !== "nouvelleCouverture"
        )
        .reduce((obj, key) => {
          obj[key] = oeuvreData[key];
          return obj;
        }, {});
  
      Object.entries(filteredOeuvreData).forEach(([key, value]) => {
        formData.append(`data[${key}]`, value);
      });
  
      // 4. Envoi PUT final avec image liée
      await axios.put(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      setMessage("Les informations de l'œuvre ont été mises à jour.");
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'œuvre :",
        error.response?.data || error.message
      );
      setMessage("Erreur lors de la mise à jour de l'œuvre.");
    }
  };
  
  
  
  
  
  

  return (
    <FormulaireModificationOeuvre
    oeuvre={oeuvre}
    oeuvreData={oeuvreData}
    preview={preview}
    message={message}
    handleOeuvreChange={handleOeuvreChange}
    handleFileChange={handleFileChange}
    handleSaveOeuvre={handleSaveOeuvre}
  />
  );
  
  
};

export default MoOeuvre;
