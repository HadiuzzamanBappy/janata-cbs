import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { PropertyWidth } from "@/lib/data-schemas/form-engine-schema";

export type RenderBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] };

/**
 * Clusters sections into render-blocks preserving insertion order.
 * Tab sections sharing a tabGroupId are clustered into an inline tab group at
 * the exact position where the first tab section appears.
 */
export function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const seenTabGroups = new Map<string, FormSection[]>();

  for (const sec of sections) {
    if (sec.zone === "tab") {
      const grpId = sec.tabGroupId?.trim() || "default_tab_group";
      if (!seenTabGroups.has(grpId)) {
        const grpList: FormSection[] = [sec];
        seenTabGroups.set(grpId, grpList);
        blocks.push({ type: "tab-group", groupId: grpId, tabSections: grpList });
      } else {
        seenTabGroups.get(grpId)?.push(sec);
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
}

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

export function getFieldColSpanClass(cols: number, width?: PropertyWidth | number): string {
  if (cols <= 1) {
    return "w-full";
  }
  if (typeof width === "number") {
    if (width >= 1000) return "col-span-full w-full";
    if (cols === 2) {
      return width >= 400 ? "col-span-2 w-full" : "col-span-1 w-full";
    }
    if (cols === 3) {
      if (width >= 600) return "col-span-3 w-full";
      if (width >= 350) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
    if (cols === 4) {
      if (width >= 800) return "col-span-4 w-full";
      if (width >= 550) return "col-span-3 w-full";
      if (width >= 350) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
  }
  return "col-span-1 w-full";
}
