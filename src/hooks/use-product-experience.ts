import { useMotionValueEvent, useScroll, useSpring, type MotionValue } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

type RotationState = { x: number; y: number };

export type ProductExperienceController = {
  activeIndex: number;
  progress: MotionValue<number>;
  rotation: RefObject<RotationState>;
  select: (index: number) => void;
  stepPhysics: (delta: number) => void;
  pointerHandlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function useProductExperience(
  sectionRef: RefObject<HTMLElement | null>,
  productCount: number,
): ProductExperienceController {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 105,
    damping: 30,
    mass: 0.35,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const rotation = useRef<RotationState>({ x: 0, y: 0 });
  const velocity = useRef<RotationState>({ x: 0, y: 0 });
  const drag = useRef({
    pointerId: -1,
    active: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    time: 0,
  });

  useMotionValueEvent(progress, "change", (value) => {
    if (productCount < 2 || drag.current.active) return;
    const next = clamp(Math.round(value * (productCount - 1)), 0, productCount - 1);
    setActiveIndex((current) => (current === next ? current : next));
  });

  useEffect(() => {
    setActiveIndex((current) => clamp(current, 0, Math.max(0, productCount - 1)));
  }, [productCount]);

  const finishDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerId !== drag.current.pointerId) return;
      const swipeX = event.clientX - drag.current.startX;
      const swipeY = event.clientY - drag.current.startY;
      if (Math.abs(swipeX) > 56 && Math.abs(swipeX) > Math.abs(swipeY) * 1.2) {
        setActiveIndex((current) =>
          clamp(current + (swipeX < 0 ? 1 : -1), 0, Math.max(0, productCount - 1)),
        );
      }
      drag.current.active = false;
      drag.current.pointerId = -1;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [productCount],
  );

  const cancelDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerId !== drag.current.pointerId) return;
    drag.current.active = false;
    drag.current.pointerId = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const pointerHandlers = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag.current = {
        pointerId: event.pointerId,
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
      };
      velocity.current = { x: 0, y: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
      const now = performance.now();
      const elapsed = Math.max(8, now - drag.current.time);
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      const sensitivity = event.pointerType === "touch" ? 0.006 : 0.0045;

      rotation.current.y += dx * sensitivity;
      rotation.current.x = clamp(rotation.current.x + dy * sensitivity, -0.55, 0.55);
      velocity.current.y = (dx * sensitivity) / (elapsed / 16.67);
      velocity.current.x = (dy * sensitivity) / (elapsed / 16.67);
      drag.current.x = event.clientX;
      drag.current.y = event.clientY;
      drag.current.time = now;
    },
    onPointerUp: finishDrag,
    onPointerCancel: cancelDrag,
  };

  const stepPhysics = useCallback((delta: number) => {
    if (drag.current.active) return;
    const frame = Math.min(delta * 60, 2);
    rotation.current.x += velocity.current.x * frame;
    rotation.current.y += velocity.current.y * frame;
    const decay = Math.pow(0.91, frame);
    velocity.current.x *= decay;
    velocity.current.y *= decay;

    // Only pitch springs home; yaw remains where the customer leaves it.
    velocity.current.x += -rotation.current.x * 0.012 * frame;
    rotation.current.x = clamp(rotation.current.x, -0.62, 0.62);
  }, []);

  return {
    activeIndex,
    progress,
    rotation,
    select: (index) => setActiveIndex(clamp(index, 0, Math.max(0, productCount - 1))),
    stepPhysics,
    pointerHandlers,
  };
}
