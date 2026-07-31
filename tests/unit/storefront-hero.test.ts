import { describe, it, expect } from "vitest";
import { HeroConfigSchema } from "@/lib/domain/appearance";

describe("Storefront Hero Routing and Schema Verification", () => {
  it("validates hero config type defaults and enum options", () => {
    const parsed = HeroConfigSchema.parse({ type: "sphere_3d" });
    expect(parsed.type).toBe("sphere_3d");

    const cinematic = HeroConfigSchema.parse({ type: "cinematic" });
    expect(cinematic.type).toBe("cinematic");

    const banner = HeroConfigSchema.parse({ type: "banner_image" });
    expect(banner.type).toBe("banner_image");

    const video = HeroConfigSchema.parse({ type: "video" });
    expect(video.type).toBe("video");

    const slideshow = HeroConfigSchema.parse({ type: "slideshow" });
    expect(slideshow.type).toBe("slideshow");
  });

  it("handles unknown hero type with safe fallback", () => {
    const unknownType = HeroConfigSchema.parse({ type: "unknown_hero_type" as any });
    expect(unknownType.type).toBe("sphere_3d");
  });

  it("supports sphere customization settings in schema", () => {
    const custom = HeroConfigSchema.parse({
      sphereMaxProducts: 40,
      sphereRadius: 3.0,
      sphereTileScale: 1.2,
      sphereCardShape: "circle",
      sphereShowName: true,
      sphereShowPrice: false,
      showParticles: true,
    });
    expect(custom.sphereMaxProducts).toBe(40);
    expect(custom.sphereRadius).toBe(3.0);
    expect(custom.sphereTileScale).toBe(1.2);
    expect(custom.sphereCardShape).toBe("circle");
    expect(custom.sphereShowPrice).toBe(false);
  });
});
