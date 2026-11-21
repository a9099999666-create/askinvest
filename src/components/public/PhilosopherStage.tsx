"use client";

import { useEffect, useRef } from "react";

export function PhilosopherStage({
  variant = "ambient",
}: {
  variant?: "hero" | "ambient";
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.muted = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      node.pause();
      node.currentTime = 3.4;
      return;
    }
    node.play().catch(() => undefined);
  }, []);

  const video = (
    <video
      ref={ref}
      className={
        variant === "hero"
          ? "h-full w-full object-contain"
          : "h-full w-full object-contain"
      }
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/brand/thinker.jpg"
      src="/brand/thinker.mp4"
      aria-hidden
    />
  );

  if (variant === "hero") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {video}
        <div className="hero-wash" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void">
      {video}
      <div className="ambient-wash" />
    </div>
  );
}
