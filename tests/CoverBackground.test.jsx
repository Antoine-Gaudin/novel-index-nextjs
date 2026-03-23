import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, whileHover, exit, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

const CoverBackground = (await import("@/app/components/CoverBackground")).default;

describe("CoverBackground", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.restoreAllMocks();
  });

  it("ne rend rien quand la liste de couvertures est vide", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: [] }),
    });

    const { container } = render(<CoverBackground />);
    // Doit rendre null (vide)
    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });

  it("affiche les images après fetch réussi", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [
            { id: 1, titre: "Naruto", couverture: { url: "https://img.example.com/naruto.jpg" } },
            { id: 2, titre: "One Piece", couverture: { url: "https://img.example.com/op.jpg" } },
          ],
        }),
    });

    render(<CoverBackground />);
    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it("utilise l'alt correct pour les images", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [
            { id: 1, titre: "Naruto", couverture: { url: "https://img.example.com/naruto.jpg" } },
          ],
        }),
    });

    render(<CoverBackground />);
    await waitFor(() => {
      expect(screen.getAllByAltText("Couverture de Naruto").length).toBeGreaterThan(0);
    });
  });

  it("ne rend rien en cas d'erreur API", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("err"));

    const { container } = render(<CoverBackground />);
    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });

  it("duplique les couvertures pour remplir la grille", async () => {
    // 3 couvertures → doit dupliquer pour atteindre ~50
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [
            { id: 1, titre: "A", couverture: { url: "https://img.example.com/a.jpg" } },
            { id: 2, titre: "B", couverture: { url: "https://img.example.com/b.jpg" } },
            { id: 3, titre: "C", couverture: { url: "https://img.example.com/c.jpg" } },
          ],
        }),
    });

    render(<CoverBackground />);
    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.length).toBe(50);
    });
  });
});
