import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { memo, type ReactNode } from "react";
import { DURATION, EASE_OUT, staggerDelay } from "./motion-tokens";

type RevealProps = {
  children: ReactNode;
  /** Position in a list — used for a small, capped stagger. */
  index?: number;
  /** Extra delay in seconds on top of the stagger. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "animate" | "whileInView">;

/**
 * One-shot viewport entrance: opacity 0→1, y 24→0, scale 0.97→1.
 * `once: true` means the IntersectionObserver detaches after the first fire,
 * so scrolling back over a section never restarts work.
 */
function RevealImpl({
  children,
  index = 0,
  delay = 0,
  className,
  as = "div",
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  if (reduced) {
    return (
      <Tag
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: DURATION.fast }}
        {...rest}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{
        duration: DURATION.base,
        ease: EASE_OUT,
        delay: delay + staggerDelay(index),
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export const Reveal = memo(RevealImpl);
