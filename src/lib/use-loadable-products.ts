import { useEffect, useMemo, useState } from "react";
import type { LegacyProductShape } from "@/lib/data-adapter";

/**
 * Image reachability probing for WebGL textures.
 *
 * The catalog contains real product rows whose images live on third-party
 * hosts. Some of those hosts can be unreachable at runtime (expired assets,
 * upstream billing, network policy). Rendering a tile for an unreachable image
 * leaves a black rectangle on the globe, so the pool is oversampled and every
 * candidate image is probed first; only images that actually decode are used.
 *
 * No hostname is special-cased — reachability is measured, never assumed.
 */
const probes = new Map<string, Promise<boolean>>();

export function proxiedImageUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return value;
    return `/api/public/image-proxy?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return value;
  }
}

function probe(url: string): Promise<boolean> {
  const hit = probes.get(url);
  if (hit) return hit;
  const pending = new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = (ok: boolean) => {
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };
    img.onload = () => done(img.naturalWidth > 1 && img.naturalHeight > 1);
    img.onerror = () => done(false);
    img.src = url;
  });
  probes.set(url, pending);
  return pending;
}

/** Probe with bounded concurrency, stop as soon as `want` images are valid. */
async function selectLoadable(
  candidates: LegacyProductShape[],
  want: number,
  onResult: (list: LegacyProductShape[]) => void,
) {
  const valid: LegacyProductShape[] = [];
  const queue = [...candidates];
  let stopped = false;

  const worker = async () => {
    while (!stopped) {
      const next = queue.shift();
      if (!next) return;
      const ok = await probe(proxiedImageUrl(String(next.image)));
      if (!ok) continue;
      valid.push(next);
      onResult([...valid]);
      if (valid.length >= want) stopped = true;
    }
  };

  await Promise.all(Array.from({ length: Math.min(10, candidates.length) }, worker));
}

/**
 * Returns the subset of `products` whose images are proven loadable, capped at
 * `want`. Results stream in as probes resolve so the globe fills progressively
 * instead of waiting for the slowest candidate.
 */
export function useLoadableProducts(
  products: LegacyProductShape[],
  want: number,
): { items: LegacyProductShape[]; settled: boolean } {
  const candidates = useMemo(
    () => products.filter((p) => typeof p.image === "string" && !!p.image.trim()),
    [products],
  );
  const key = useMemo(() => candidates.map((p) => p.id).join("|"), [candidates]);

  const [items, setItems] = useState<LegacyProductShape[]>(() => candidates.slice(0, want));
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let alive = true;
    setSettled(false);
    if (candidates.length > 0) {
      setItems(candidates.slice(0, want));
    }
    selectLoadable(candidates, want, (list) => {
      if (!alive) return;
      const next = list.length > 0 ? list.slice(0, want) : candidates.slice(0, want);
      setItems(next);
      (window as unknown as Record<string, unknown>).__globeTiles = next.length;
    }).finally(() => {
      if (alive) setSettled(true);
    });
    return () => {
      alive = false;
    };
  }, [key, want]);

  return { items, settled };
}
