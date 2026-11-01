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
  const token = typeof width === "string" ? width.toLowerCase().trim() : "";
  if (token === "full" || token === "xxl") {
    return "col-span-full w-full";
  }
  if (token === "xl") {
    return cols >= 3
      ? "col-span-full w-full"
      : cols === 2
        ? "col-span-2 w-full"
        : "col-span-1 w-full";
  }
  if (token === "lg") {
    return cols >= 3 ? "col-span-2 w-full" : "col-span-1 w-full";
  }
  if (cols === 2) {
    return typeof width === "number" && width >= 400 ? "col-span-2 w-full" : "col-span-1 w-full";
  }
  if (cols === 3) {
    if (typeof width === "number" && width >= 600) return "col-span-3 w-full";
    if (typeof width === "number" && width >= 350) return "col-span-2 w-full";
    return "col-span-1 w-full";
  }
  if (cols === 4) {
    if (typeof width === "number" && width >= 800) return "col-span-4 w-full";
    if (typeof width === "number" && width >= 550) return "col-span-3 w-full";
    if (typeof width === "number" && width >= 350) return "col-span-2 w-full";
    return "col-span-1 w-full";
  }
  return "w-full";
}
