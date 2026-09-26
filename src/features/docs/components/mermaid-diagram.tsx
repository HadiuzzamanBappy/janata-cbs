// Mermaid Diagram Renderer Component (Documentation Utility)
"use client";

import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    const isDark = resolvedTheme === "dark";

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "var(--font-sans)",
      themeVariables: {
        darkMode: isDark,
        background: "transparent",
        mainBkg: "transparent",
        nodeBkg: "transparent",
        nodeBorder: isDark ? "#38bdf8" : "#0284c7",
        clusterBkg: "transparent",
        clusterBorder: isDark ? "#334155" : "#cbd5e1",
        lineColor: isDark ? "#94a3b8" : "#64748b",
        textColor: isDark ? "#f8fafc" : "#0f172a",
        edgeLabelBackground: "transparent",
        tertiaryColor: "transparent",
        labelBackground: "transparent",
      },
    });

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (isMounted && containerRef.current) {
          const styleOverride = `<style>
            svg rect.edgeLabel, 
            svg .edgeLabel rect, 
            svg .label-container, 
            svg .edgeLabel span,
            svg .edgeLabel div,
            svg .labelBkg {
              fill: transparent !important;
              background-color: transparent !important;
              background: transparent !important;
            }
            svg .edgeLabel, svg .edgeLabel span, svg .edgeLabel div {
              color: ${isDark ? "#f8fafc" : "#0f172a"} !important;
            }
          </style>`;
          const cleanedSvg = svg.replace("</svg>", `${styleOverride}</svg>`);
          containerRef.current.innerHTML = cleanedSvg;
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
  }, [chart, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-card/40 p-6 shadow-xs transition-colors [&_.edgeLabel_rect]:!fill-transparent [&_.edgeLabel_span]:!bg-transparent [&_.edgeLabel_div]:!bg-transparent"
    />
  );
}



