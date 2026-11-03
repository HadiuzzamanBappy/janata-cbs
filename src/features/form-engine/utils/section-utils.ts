import type { PropertyWidth } from "@/lib/data-schemas/model-config-schema";

export function getGridColsClass(cols: number): string {
  switch (cols) {
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    case 4:
      return "grid-cols-4";
    default:
      return "grid-cols-1";
  }
}

export function getFieldColSpanClass(
  cols: number,
  width?: PropertyWidth | string | number,
): string {
  if (cols <= 1) {
    return "w-full";
  }
  const numWidth =
    typeof width === "number"
      ? width
      : typeof width === "string" && /^\d+(\.\d+)?$/.test(width.trim())
        ? Number(width.trim())
        : undefined;

  if (numWidth !== undefined) {
    if (numWidth >= 1000) return "col-span-full w-full";
    if (cols === 2) {
      return numWidth >= 400 ? "col-span-2 w-full" : "col-span-1 w-full";
    }
    if (cols === 3) {
      if (numWidth >= 600) return "col-span-3 w-full";
      if (numWidth >= 350) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
    if (cols === 4) {
      if (numWidth >= 800) return "col-span-4 w-full";
      if (numWidth >= 550) return "col-span-3 w-full";
      if (numWidth >= 350) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
  }
  return "col-span-1 w-full";
}
