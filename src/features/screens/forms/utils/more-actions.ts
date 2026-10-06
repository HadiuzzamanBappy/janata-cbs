import { toast } from "@/components/ui/toast";
import type { MoreActionItem } from "@/features/screens/shared/cbs-form-header";

/**
 * Default preset action menu items for CBS screens (Live files, unauth, history, inquiries).
 */
export function getDefaultMoreActions(code: string): MoreActionItem[] {
  return [
    {
      label: "List Live File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Listing active live records for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List Unauth File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Listing unauthorized records for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List History File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Fetching history records for ${code}`,
          type: "info",
        }),
      requiredRight: "R",
    },
    {
      label: "Search Live File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Live File search dialog for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "Search Unauth File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Unauthorized File search dialog for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "Customer Positions",
      onClick: () =>
        toast.add({
          title: "Customer Inquiry",
          description: "Fetching overall customer positions summary",
          type: "info",
        }),
      requiredRight: "R",
    },
    {
      label: "Account List",
      onClick: () =>
        toast.add({
          title: "Account Inquiry",
          description: "Retrieving account list",
          type: "info",
        }),
      requiredRight: "R",
    },
  ];
}
