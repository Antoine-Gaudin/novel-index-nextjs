"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import FormulaireModificationOeuvre from "../components/FormMoOeuvre";

const STRAPI_URL = "https://novel-index-strapi.onrender.com";

const MoOeuvre = ({ user, oeuvre, onDirty }) => {
  const [oeuvreData, setOeuvreData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [feedback, setFeedback] = useState(null); // { type: "success"|"error", message }
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewUrlRef = useRef(null);

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
      setLoading(true);
      try {
        const jwt = localStorage.getItem("jwt");
        const response = await axios.get(
          `${STRAPI_URL}/api/oeuvres/${oeuvre.documentId}?populate=couverture`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const data = response.data.data;
        setOeuvreData(data || {});
        setOriginalData(data || {});
        setPreview(data?.couverture?.url || null);
      } catch (error) {
        console.error("Erreur fetch oeuvre:", error);
        setFeedback({
          type: "error",
          message: "Erreur lors de la recuperation de l'oeuvre.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOeuvre();

    return () => {
      // Cleanup URL object
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [oeuvre]);

  const handleOeuvreChange = (e) => {
    const { name, value, type, checked } = e.target;
    const parsedValue = type === "checkbox" ? checked : value;

    setOeuvreData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
    onDirty?.(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Cleanup previous blob URL
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const blobUrl = URL.createObjectURL(file);
      previewUrlRef.current = blobUrl;
      setPreview(blobUrl);

      setOeuvreData((prev) => ({
        ...prev,
        nouvelleCouverture: file,
      }));
      onDirty?.(true);
    }
  };

  const handleSaveOeuvre = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    try {
      const jwt = localStorage.getItem("jwt");
      const formData = new FormData();

      // Upload image separement si nouvelle
      if (oeuvreData.nouvelleCouverture instanceof File) {
        const imageForm = new FormData();
        imageForm.append("files", oeuvreData.nouvelleCouverture);

        const uploadRes = await axios.post(
          `${STRAPI_URL}/api/upload`,
          imageForm,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const uploadedImageId = uploadRes.data[0]?.id;
        if (uploadedImageId) {
          formData.append("data[couverture]", uploadedImageId);
        }
      }

      // Ajoute les champs texte sauf les exclus
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
        if (key === "licence") {
          const finalBool = value === true ? "true" : "false";
          formData.append(`data[${key}]`, finalBool);
        } else {
          formData.append(`data[${key}]`, value ?? "");
        }
      });

      await axios.put(
        `${STRAPI_URL}/api/oeuvres/${oeuvre.documentId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFeedback({
        type: "success",
        message: "Les informations de l'oeuvre ont ete mises a jour.",
      });
      setOriginalData({ ...oeuvreData });
      onDirty?.(false);

      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      console.error(
        "Erreur mise a jour oeuvre:",
        error.response?.data || error.message
      );
      setFeedback({
        type: "error",
        message: "Erreur lors de la mise a jour de l'oeuvre.",
      });
    } finally {
      setSaving(false);
    }
  }, [oeuvreData, oeuvre, saving, onDirty]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveOeuvre();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveOeuvre]);

  return (
    <FormulaireModificationOeuvre
      oeuvre={oeuvre}
      oeuvreData={oeuvreData}
      originalData={originalData}
      preview={preview}
      feedback={feedback}
      loading={loading}
      saving={saving}
      handleOeuvreChange={handleOeuvreChange}
      handleFileChange={handleFileChange}
      handleSaveOeuvre={handleSaveOeuvre}
    />
  );
};

export default MoOeuvre;
