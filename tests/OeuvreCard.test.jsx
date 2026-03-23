import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OeuvreCard } from "@/app/components/OeuvreCard";

// Mock dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...filterMotionProps(props)}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("react-icons/fi", () => ({
  FiBook: () => <span data-testid="icon-book" />,
}));

// Helper pour filtrer les props framer-motion
function filterMotionProps(props) {
  const { initial, animate, transition, whileHover, exit, ...rest } = props;
  return rest;
}

// Import default car c'est un export default
const OeuvreCardComponent = (await import("@/app/components/OeuvreCard")).default;

const mockOeuvre = {
  documentId: "abc123",
  titre: "Solo Leveling",
  type: "Manga",
  traduction: "TeamA",
  couverture: { url: "https://img.example.com/solo.jpg" },
  categorie: "Shonen",
};

describe("OeuvreCard", () => {
  it("affiche le titre de l'oeuvre", () => {
    render(<OeuvreCardComponent oeuvre={mockOeuvre} />);
    expect(screen.getByText("Solo Leveling")).toBeInTheDocument();
  });

  it("affiche le type de l'oeuvre", () => {
    render(<OeuvreCardComponent oeuvre={mockOeuvre} />);
    expect(screen.getByText("Manga")).toBeInTheDocument();
  });

  it("génère un lien avec le bon href", () => {
    render(<OeuvreCardComponent oeuvre={mockOeuvre} />);
    const link = screen.getByText("Solo Leveling").closest("a");
    expect(link).toHaveAttribute("href", "/oeuvre/abc123-solo-leveling");
  });

  it("affiche l'image de couverture quand elle existe", () => {
    render(<OeuvreCardComponent oeuvre={mockOeuvre} />);
    const img = screen.getByAltText("Solo Leveling");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://img.example.com/solo.jpg");
  });

  it("affiche un placeholder quand il n'y a pas de couverture", () => {
    const nocover = { ...mockOeuvre, couverture: null };
    render(<OeuvreCardComponent oeuvre={nocover} />);
    expect(screen.getByTestId("icon-book")).toBeInTheDocument();
  });

  it("gère un titre vide", () => {
    const notitle = { ...mockOeuvre, titre: "" };
    render(<OeuvreCardComponent oeuvre={notitle} />);
    // Le type est toujours affiché même sans titre
    expect(screen.getByText("Manga")).toBeInTheDocument();
  });
});
