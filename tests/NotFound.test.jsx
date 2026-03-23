import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

describe("NotFound (404)", () => {
  it("affiche le code 404", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("affiche le message 'Page introuvable'", () => {
    render(<NotFound />);
    expect(screen.getByText("Page introuvable")).toBeInTheDocument();
  });

  it("affiche un texte explicatif", () => {
    render(<NotFound />);
    expect(screen.getByText(/la page que vous recherchez/i)).toBeInTheDocument();
  });

  it("affiche un lien de retour vers les œuvres", () => {
    render(<NotFound />);
    const link = screen.getByText(/retour aux œuvres/i);
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/Oeuvres");
  });
});
