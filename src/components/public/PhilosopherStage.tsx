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
      node.currentTime = 5;
      return;
    }
    node.play().catch(() => undefined);
  }, []);

  const video = (
    <video
      ref={ref}
      className="h-full w-full object-cover object-center"
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
