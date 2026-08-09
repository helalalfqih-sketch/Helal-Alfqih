import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Image that cross-fades in once decoded, and cross-fades again when the src
 * changes. Fixed aspect ratio via width/height keeps layout stable (no CLS)
 * and avoids the black-frame / flash artefacts of raw <img> swaps.
 *
 * When the source cannot be fetched (dead upstream host, 4xx/5xx) a branded
 * placeholder is rendered instead of a broken image icon. No substitute
 * product photo is ever invented.
 */
export function FadeImage({
  src,
  alt,
  className = "",
  width = 400,
  height = 400,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(!src || !src.trim());
    // Cached images can complete before React attaches onLoad.
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-[linear-gradient(140deg,rgba(20,10,56,0.9),rgba(5,8,22,0.98))] ${className}`}
      >
        <div className="flex flex-col items-center gap-1 text-ink-muted">
          <ImageOff className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[8px] font-bold tracking-[0.18em] text-ink-muted">INDEXES</span>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`transition-opacity duration-500 ease-out ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
