/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_HERO_CONFIG, type HeroConfig } from "@/lib/domain/appearance";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@/components/product-sphere-hero", () => ({
  ProductSphereHero: ({ products }: { products: unknown[] }) => (
    <div data-testid="sphere-implementation">sphere:{products.length}</div>
  ),
}));

vi.mock("@/components/immersive/ImmersiveProductExperience", () => ({
  ImmersiveProductExperience: ({ products }: { products: unknown[] }) => (
    <div data-testid="cinematic-implementation">cinematic:{products.length}</div>
  ),
}));

import { StorefrontHero } from "@/routes/index";

const hero = (overrides: Partial<HeroConfig> = {}): HeroConfig => ({
  ...DEFAULT_HERO_CONFIG,
  ...overrides,
});

afterEach(cleanup);

describe("StorefrontHero routing", () => {
  it("renders only ProductSphereHero for sphere_3d", async () => {
    render(<StorefrontHero hero={hero({ type: "sphere_3d" })} products={[]} />);

    expect(screen.getByTestId("hero-sphere-3d")).toBeTruthy();
    expect(await screen.findByTestId("sphere-implementation")).toBeTruthy();
    expect(screen.queryByTestId("hero-cinematic")).toBeNull();
    expect(screen.queryByTestId("cinematic-implementation")).toBeNull();
  });

  it("renders only ImmersiveProductExperience for cinematic", async () => {
    render(<StorefrontHero hero={hero({ type: "cinematic" })} products={[]} />);

    expect(screen.getByTestId("hero-cinematic")).toBeTruthy();
    expect(await screen.findByTestId("cinematic-implementation")).toBeTruthy();
    expect(screen.queryByTestId("hero-sphere-3d")).toBeNull();
    expect(screen.queryByTestId("sphere-implementation")).toBeNull();
  });

  it.each([
    ["banner_image", "hero-banner"],
    ["video", "hero-video"],
    ["slideshow", "hero-slideshow"],
  ] as const)("renders %s without mounting a WebGL hero", (type, testId) => {
    render(<StorefrontHero hero={hero({ type })} products={[]} />);

    expect(screen.getByTestId(testId)).toBeTruthy();
    expect(screen.queryByTestId("sphere-implementation")).toBeNull();
    expect(screen.queryByTestId("cinematic-implementation")).toBeNull();
  });

  it("renders nothing when the hero is disabled", () => {
    const { container } = render(
      <StorefrontHero hero={hero({ enabled: false, type: "sphere_3d" })} products={[]} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("unmounts the sphere when switching to cinematic", async () => {
    const { rerender } = render(
      <StorefrontHero hero={hero({ type: "sphere_3d" })} products={[]} />,
    );
    expect(await screen.findByTestId("sphere-implementation")).toBeTruthy();

    rerender(<StorefrontHero hero={hero({ type: "cinematic" })} products={[]} />);

    await waitFor(() => expect(screen.queryByTestId("sphere-implementation")).toBeNull());
    expect(await screen.findByTestId("cinematic-implementation")).toBeTruthy();
  });

  it("handles an empty product array without throwing", async () => {
    expect(() =>
      render(<StorefrontHero hero={hero({ type: "sphere_3d" })} products={[]} />),
    ).not.toThrow();
    expect(await screen.findByText("sphere:0")).toBeTruthy();
  });
});
