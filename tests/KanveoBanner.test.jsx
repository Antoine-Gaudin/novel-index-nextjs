import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const KanveoBanner = (await import("@/app/components/KanveoBanner")).default;

describe("KanveoBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne rend rien avant que le délai ne soit écoulé", () => {
    const { container } = render(<KanveoBanner delay={500} />);
    expect(container.innerHTML).toBe("");
  });

  it("apparaît après le délai configuré", async () => {
    render(<KanveoBanner delay={500} />);
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.getAllByText("Kanveo").length).toBeGreaterThan(0);
  });

  it("utilise un délai par défaut de 800ms", async () => {
    render(<KanveoBanner />);
    await act(async () => { vi.advanceTimersByTime(799); });
    expect(screen.queryAllByText("Kanveo")).toHaveLength(0);
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.getAllByText("Kanveo").length).toBeGreaterThan(0);
  });

  it("rend le format banner par défaut", () => {
    render(<KanveoBanner delay={0} />);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText("Essayer →")).toBeInTheDocument();
  });

  it("rend le format card", () => {
    render(<KanveoBanner format="card" delay={0} />);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText("Commencer maintenant →")).toBeInTheDocument();
  });

  it("rend le format mini", () => {
    render(<KanveoBanner format="mini" delay={0} />);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText("Essayer")).toBeInTheDocument();
  });

  it("contient un lien vers kanveo", () => {
    render(<KanveoBanner delay={0} />);
    act(() => vi.advanceTimersByTime(0));
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link.getAttribute("href")).toBe("https://kanveo.fr/ref/3HAW4BNP");
    });
  });

  it("applique les classes supplémentaires via className", () => {
    const { container } = render(<KanveoBanner delay={0} className="test-class" />);
    act(() => vi.advanceTimersByTime(0));
    expect(container.querySelector(".test-class")).toBeInTheDocument();
  });
});
