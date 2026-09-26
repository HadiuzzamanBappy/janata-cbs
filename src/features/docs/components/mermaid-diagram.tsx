// Mermaid Diagram Renderer Component (Documentation Utility)
"use client";

import mermaid from "mermaid";
import { useEffect, useRef } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "var(--font-sans)",
});

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err) => {
        console.error("Mermaid rendering error:", err);
      });

    return () => {
      isMounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [chart]);

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border bg-card/60 p-6 shadow-xs"
    />
  );
}
