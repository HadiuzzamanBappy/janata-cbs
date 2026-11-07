import * as React from "react";

/**
 * Tracks the pixel width of an HTML container element using a native ResizeObserver.
 * Returns { ref, width, isCompact } where isCompact is true when width < threshold.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>(threshold: number = 860) {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState<number>(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = Math.round(entry.contentRect.width);
        setWidth(w);
      }
    });

    observer.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));

    return () => {
      observer.disconnect();
    };
  }, []);

  const isCompact = width > 0 && width < threshold;

  return { ref, width, isCompact };
}
