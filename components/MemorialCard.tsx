"use client";
import { useEffect, useRef } from "react";
import type { CardContent } from "@/lib/card-types";
import { renderToCanvas, DESIGNS, type Design } from "@/lib/render-card";

/**
 * Live preview. Draws on a <canvas> with the same code that creates the PDF / image,
 * and scales to the available width (CSS), so it fits every phone and desktop screen.
 */
export function MemorialCard({
  c, recipient, recipientTitle = "श्रीमान", photo, design = 1,
}: {
  c: CardContent; recipient: string; recipientTitle?: "श्रीमान" | "श्रीमती"; photo?: string; design?: Design;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const portrait = photo || c.portraitUrl || "";
  // re-draw only when something that is visible really changed
  const key = JSON.stringify([c, recipient, recipientTitle, portrait, design]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const cv = ref.current;
      if (!cv) return;
      renderToCanvas(cv, { c: { ...c, portraitUrl: portrait } as CardContent, recipient, recipientTitle, design }, 1).catch(() => {
        /* draw again on next change */
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <canvas
      ref={ref}
      className="mem-canvas"
      width={DESIGNS[design].w}
      height={DESIGNS[design].h}
      style={{ aspectRatio: `${DESIGNS[design].w} / ${DESIGNS[design].h}` }}
      role="img"
      aria-label="श्रद्धांजलि कार्ड"
    />
  );
}
