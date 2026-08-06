import { useCallback, useEffect, useRef, type ReactNode } from "react";

/**
 * Horizontal rail with native scroll physics + CSS scroll-snap.
 *
 * Native scrolling is deliberate: it settles into the nearest item with the
 * platform's own spring, never blocks vertical page scroll on touch, and costs
 * no JS per frame. Pointer-drag is added only for fine pointers (desktop),
 * where there is no touch fling to inherit.
 */
export function SnapRail({
  children,
  className = "",
  itemGapClass = "gap-3",
}: {
  children: ReactNode;
  className?: string;
  itemGapClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  }, []);

  const endDrag = useCallback(() => {
    drag.current.active = false;
  }, []);

  // Suppress the click that follows a drag so cards don't navigate accidentally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }
    };
    el.addEventListener("click", onClick, true);
    return () => el.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className={`snap-rail overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <div className={`flex ${itemGapClass}`}>{children}</div>
    </div>
  );
}
