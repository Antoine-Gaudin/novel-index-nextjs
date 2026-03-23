import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import JsonLd from "@/app/components/JsonLd";

describe("JsonLd", () => {
  it("rend un script type application/ld+json", () => {
    const data = { "@context": "https://schema.org", "@type": "WebSite", name: "Test" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
  });

  it("contient les données JSON sérialisées", () => {
    const data = { "@context": "https://schema.org", "@type": "Organization", name: "Novel-Index" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script.innerHTML);
    expect(parsed["@type"]).toBe("Organization");
    expect(parsed.name).toBe("Novel-Index");
  });

  it("gère un objet vide", () => {
    const { container } = render(<JsonLd data={{}} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    expect(JSON.parse(script.innerHTML)).toEqual({});
  });

  it("gère des données complexes imbriquées", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://example.com?q={q}" },
        "query-input": "required name=q",
      },
    };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script.innerHTML);
    expect(parsed.potentialAction["@type"]).toBe("SearchAction");
  });
});
