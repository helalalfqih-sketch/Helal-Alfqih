/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@/components/product-card", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => <article>{product.name}</article>,
}));

import { ProductSphereHero } from "@/components/product-sphere-hero";

afterEach(cleanup);

describe("ProductSphereHero WebGL fallback", () => {
  it("renders the stable product grid when WebGL is unavailable", async () => {
    render(
      <ProductSphereHero
        products={
          [
            {
              id: "1",
              name: "منتج تجريبي",
              slug: "test-product",
              image: "https://example.com/product.jpg",
            },
          ] as never
        }
      />,
    );

    await waitFor(() => expect(screen.getByTestId("hero-sphere-fallback")).toBeTruthy());
    expect(screen.getByText("منتج تجريبي")).toBeTruthy();
    expect(document.querySelectorAll("canvas")).toHaveLength(0);
  });
});
