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

export function getFieldColSpanClass(cols: number, width?: number): string {
  if (cols <= 1) {
    return "w-full";
  }
  if (cols === 2) {
    return width && width >= 400 ? "col-span-2 w-full" : "col-span-1 w-full";
  }
  if (cols === 3) {
    if (width && width >= 600) return "col-span-3 w-full";
    if (width && width >= 350) return "col-span-2 w-full";
    return "col-span-1 w-full";
  }
  if (cols === 4) {
    if (width && width >= 800) return "col-span-4 w-full";
    if (width && width >= 550) return "col-span-3 w-full";
    if (width && width >= 350) return "col-span-2 w-full";
    return "col-span-1 w-full";
  }
  return "w-full";
}
