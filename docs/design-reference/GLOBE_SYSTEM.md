# Holographic Globe 3D Presentation System

The Holographic Globe is a zero-dependency HTML5 2D Canvas math-driven interactive 3D sphere presentation component.

## Key Technical Specifications:
- **Renderer**: Pure HTML5 2D Canvas with DPR high-DPI scaling.
- **Coordinates & Rotation**: Matrix 3D spherical point projection (Latitude & Longitude).
- **Interactivity**: Drag-to-rotate touch and pointer event listeners with inertial momentum decay.
- **Hydration & SSR Safety**: Pure client-side Canvas lifecycle wrapped cleanly in `useEffect`.
- **Product Integration**: Maps real Supabase product DTOs (`LegacyProductShape`) to floating badge overlays with depth scaling and opacity shading.
