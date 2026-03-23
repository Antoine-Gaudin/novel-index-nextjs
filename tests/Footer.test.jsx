import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/app/components/Footer";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// Mock react-icons
vi.mock("react-icons/fa6", () => ({
  FaXTwitter: () => <span data-testid="icon-twitter" />,
  FaDiscord: () => <span data-testid="icon-discord" />,
}));

describe("Footer", () => {
  it("rend le footer avec le nom du site", () => {
    render(<Footer />);
    expect(screen.getByText("Novel-Index")).toBeInTheDocument();
  });

  it("contient les liens de navigation principaux", () => {
    render(<Footer />);
    expect(screen.getByText("Accueil")).toBeInTheDocument();
    expect(screen.getByText("Catalogue des oeuvres")).toBeInTheDocument();
    expect(screen.getByText("Plan du site")).toBeInTheDocument();
  });

  it("contient les liens de catégories", () => {
    render(<Footer />);
    expect(screen.getByText("Tous les genres")).toBeInTheDocument();
    expect(screen.getByText("Tous les tags")).toBeInTheDocument();
  });

  it("contient les liens légaux", () => {
    render(<Footer />);
    expect(screen.getByText("Mentions légales")).toBeInTheDocument();
    expect(screen.getByText("Politique de confidentialité")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("contient les liens vers les réseaux sociaux avec aria-label", () => {
    render(<Footer />);
    expect(screen.getByLabelText("Suivez-nous sur X (Twitter)")).toBeInTheDocument();
    expect(screen.getByLabelText("Rejoignez notre Discord")).toBeInTheDocument();
  });

  it("affiche l'année courante dans le copyright", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("a un élément footer avec aria-label", () => {
    render(<Footer />);
    expect(screen.getByLabelText("Pied de page")).toBeInTheDocument();
  });

  it("les liens ont les bonnes URLs", () => {
    render(<Footer />);
    expect(screen.getByText("Accueil").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Catalogue des oeuvres").closest("a")).toHaveAttribute("href", "/Oeuvres");
    expect(screen.getByText("Mentions légales").closest("a")).toHaveAttribute("href", "/mentions-legales");
  });
});
