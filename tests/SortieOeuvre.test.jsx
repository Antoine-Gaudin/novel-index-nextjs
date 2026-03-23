import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/app/components/SectionSorties", () => ({
  default: ({ titre, oeuvres, loading, error, emptyMessage }) => (
    <div data-testid="section-sorties">
      <span>{titre}</span>
      {loading && <span>Chargement...</span>}
      {error && <span>{error}</span>}
      {!loading && !error && oeuvres.length === 0 && <span>{emptyMessage}</span>}
      {oeuvres.map((o, i) => (
        <span key={i}>{o.titre || o.type}</span>
      ))}
    </div>
  ),
}));

const SortieOeuvre = (await import("@/app/components/SortieOeuvre")).default;

describe("SortieOeuvre", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.restoreAllMocks();
  });

  it("affiche le titre '✨ Nouvelles œuvres'", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    render(<SortieOeuvre />);
    await waitFor(() => {
      expect(screen.getByText("✨ Nouvelles œuvres")).toBeInTheDocument();
    });
  });

  it("affiche les œuvres après fetch réussi", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { id: 1, titre: "One Piece", type: "Manga", couverture: { url: "/img.jpg" }, createdAt: "2025-01-01" },
          ],
        }),
    });

    render(<SortieOeuvre />);
    await waitFor(() => {
      expect(screen.getByText("One Piece")).toBeInTheDocument();
    });
  });

  it("affiche un message d'erreur en cas d'échec", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<SortieOeuvre />);
    await waitFor(() => {
      expect(screen.getByText("Impossible de récupérer les nouvelles œuvres.")).toBeInTheDocument();
    });
  });

  it("affiche le message vide quand aucune œuvre", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    render(<SortieOeuvre />);
    await waitFor(() => {
      expect(screen.getByText("Aucune nouvelle œuvre aujourd'hui.")).toBeInTheDocument();
    });
  });
});
