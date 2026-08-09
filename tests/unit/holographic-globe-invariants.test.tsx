// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  HolographicGlobe,
  type HolographicGlobeProduct,
} from "../../src/components/storefront/HolographicGlobe";

describe("HolographicGlobe Safety & Accessibility Invariants", () => {
  beforeEach(() => {
    // Mock 2D Canvas context for JSDOM
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      scale: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      strokeStyle: "",
      lineWidth: 1,
      shadowColor: "",
      shadowBlur: 0,
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);
  });

  const sampleProducts: readonly HolographicGlobeProduct[] = [
    {
      id: "prod-1",
      slug: "product-slug-1",
      name: "اختبار هاتف ذكي",
      image: "https://example.com/phone.jpg",
      price: 299,
    },
    {
      id: "prod-2",
      slug: "product-slug-2",
      name: "حاسوب محمول احترافي",
      image: "https://example.com/laptop.jpg",
      price: 999,
    },
  ];

  it("triggers onSelectProduct with exact product containing slug when clicked", () => {
    const handleSelect = vi.fn();
    render(
      <HolographicGlobe
        products={sampleProducts}
        onSelectProduct={handleSelect}
        showTitleBadge={false}
      />,
    );

    const btn = screen.getByRole("button", {
      name: "عرض تفاصيل اختبار هاتف ذكي",
    });
    expect(btn).not.toBeNull();

    fireEvent.click(btn);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const selectedProd = handleSelect.mock.calls[0][0] as HolographicGlobeProduct;
    expect(selectedProd.slug).toBe("product-slug-1");
    expect(selectedProd.id).toBe("prod-1");
  });

  it("supports keyboard activation via Enter key", () => {
    const handleSelect = vi.fn();
    render(
      <HolographicGlobe
        products={sampleProducts}
        onSelectProduct={handleSelect}
        showTitleBadge={false}
      />,
    );

    const btn = screen.getByRole("button", {
      name: "عرض تفاصيل حاسوب محمول احترافي",
    });

    fireEvent.keyDown(btn, { key: "Enter", code: "Enter" });

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const selectedProd = handleSelect.mock.calls[0][0] as HolographicGlobeProduct;
    expect(selectedProd.slug).toBe("product-slug-2");
  });

  it("cancels animation frame cleanly on unmount", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(
      <HolographicGlobe products={sampleProducts} showTitleBadge={false} />,
    );

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});
