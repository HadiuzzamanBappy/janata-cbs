import { toast } from "@/components/ui/toast";
import type { MoreActionItem } from "../components/action-more-menu";

/**
 * Standard preset More Actions menu items for CBS form screens (Live files, unauth, history, inquiries).
 * Unifies the standard menu items across all screens (except inquiries).
 */
export function getDefaultMoreActions(code: string): MoreActionItem[] {
  const cleanCode = (code || "RECORD").trim().toUpperCase();

  return [
    {
      label: "List Live File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Listing active live records for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List Unauth File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Listing unauthorized records for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List History File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Fetching history records for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "R",
    },
    {
      label: "Search Live File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Live File search dialog for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "Search Unauth File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Unauthorized File search dialog for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
  ];
}
