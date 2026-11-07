import type { FormSection } from "@/lib/data-schemas/form-config-schema";

export type RenderBlock =
  | { type: "single"; section: FormSection }
  | { type: "tab-group"; groupId: string; tabSections: FormSection[] }
  | { type: "step-group"; groupId: string; stepSections: FormSection[] };

/**
 * Clusters sections into render-blocks preserving designer order.
 * - Tab sections sharing a groupId are clustered into an inline tab group.
 * - Step sections sharing a groupId are clustered into an inline wizard/stepper.
 * - Single sections (card or plain) are rendered sequentially.
 */
export function buildRenderBlocks(sections: FormSection[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const seenTabGroups = new Map<string, FormSection[]>();
  const seenStepGroups = new Map<string, FormSection[]>();

  for (const sec of sections) {
    const isTab = sec.containerType === "tab";
    const isStep = sec.containerType === "step";

    if (isTab) {
      const grpId = sec.groupId?.trim() || "default_tab_group";
      if (!seenTabGroups.has(grpId)) {
        const grpList: FormSection[] = [sec];
        seenTabGroups.set(grpId, grpList);
        blocks.push({ type: "tab-group", groupId: grpId, tabSections: grpList });
      } else {
        seenTabGroups.get(grpId)?.push(sec);
      }
    } else if (isStep) {
      const grpId = sec.groupId?.trim() || "default_step_group";
      if (!seenStepGroups.has(grpId)) {
        const grpList: FormSection[] = [sec];
        seenStepGroups.set(grpId, grpList);
        blocks.push({ type: "step-group", groupId: grpId, stepSections: grpList });
      } else {
        seenStepGroups.get(grpId)?.push(sec);
      }
    } else {
      blocks.push({ type: "single", section: sec });
    }
  }

  return blocks;
}
