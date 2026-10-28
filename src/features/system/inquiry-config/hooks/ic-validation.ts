import type { ZodError } from "zod";

export interface InquiryValidationErrorItem {
  id: string;
  tab: "general" | "selection" | "table";
  fieldKey: string;
  message: string;
}

/**
 * Maps Zod issues to dedicated tabs in the Inquiry Designer.
 */
export function mapZodIssuesToInquiryValidationErrors(
  error: ZodError,
): InquiryValidationErrorItem[] {
  return error.issues.map((issue, idx) => {
    const path = issue.path.join(".");
    const firstSegment = String(issue.path[0] || "");

    let tab: InquiryValidationErrorItem["tab"] = "general";
    if (firstSegment === "INQSelectField") {
      tab = "selection";
    } else if (firstSegment === "INQDef" || firstSegment === "INQCmds") {
      tab = "table";
    }

    return {
      id: `err-${idx}-${path}`,
      tab,
      fieldKey: path,
      message: issue.message,
    };
  });
}

