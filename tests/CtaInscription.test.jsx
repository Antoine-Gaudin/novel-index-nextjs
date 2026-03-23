import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("react-icons/fi", () => ({
  FiArrowRight: () => <span />,
}));

const { useAuth } = await import("@/contexts/AuthContext");
const CtaInscription = (await import("@/app/components/CtaInscription")).default;

describe("CtaInscription", () => {
  it("affiche le bouton quand l'utilisateur n'est pas connecté", () => {
    useAuth.mockReturnValue({ isLoggedIn: false, isLoading: false });
    render(<CtaInscription />);
    expect(screen.getByText("Créer un compte gratuit")).toBeInTheDocument();
  });

  it("renvoie vers /Inscription", () => {
    useAuth.mockReturnValue({ isLoggedIn: false, isLoading: false });
    render(<CtaInscription />);
    const link = screen.getByText("Créer un compte gratuit").closest("a");
    expect(link).toHaveAttribute("href", "/Inscription");
  });

  it("ne rend rien quand l'utilisateur est connecté", () => {
    useAuth.mockReturnValue({ isLoggedIn: true, isLoading: false });
    const { container } = render(<CtaInscription />);
    expect(container.innerHTML).toBe("");
  });

  it("ne rend rien pendant le chargement", () => {
    useAuth.mockReturnValue({ isLoggedIn: false, isLoading: true });
    const { container } = render(<CtaInscription />);
    expect(container.innerHTML).toBe("");
  });
});
