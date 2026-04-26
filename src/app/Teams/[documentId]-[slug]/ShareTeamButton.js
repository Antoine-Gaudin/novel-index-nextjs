"use client";

import { useState } from "react";
import { FiShare2, FiCheck, FiCopy } from "react-icons/fi";

export default function ShareTeamButton({ url, title, text }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url, title, text });
        return;
      } catch {
        // user cancelled or error → fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Partager cette team"
      aria-label="Partager cette team"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/40 backdrop-blur-md hover:bg-gray-800/60 border border-gray-700/40 rounded-lg text-sm text-gray-200 transition-colors"
    >
      {copied ? (
        <>
          <FiCheck className="text-emerald-300" /> Lien copié
        </>
      ) : (
        <>
          {typeof navigator !== "undefined" && navigator.share ? (
            <FiShare2 className="text-indigo-300" />
          ) : (
            <FiCopy className="text-indigo-300" />
          )}
          Partager
        </>
      )}
    </button>
  );
}
