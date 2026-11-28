import { toast } from "@/components/ui/toast";

/**
 * The one warning a screen raises when its validation finds issues, from Validate or Save.
 * The issues themselves are listed in the validation checklist.
 */
export function toastValidationIssues(issueCount: number): void {
  toast.add({
    title: "Validation Issues Found",
    description: `${issueCount} issue${issueCount > 1 ? "s" : ""} require your attention.`,
    type: "warning",
  });
}
