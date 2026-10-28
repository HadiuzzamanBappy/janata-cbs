import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  History,
  RotateCcw,
  Type,
} from "lucide-react";
import type * as React from "react";
import type {
  InquiryActionConfig,
  InquiryColumnConfig,
} from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export const FORMAT_OPTIONS: Array<{
  value: InquiryColumnConfig["format"];
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "text",
    label: "Text / String",
    icon: <Type className="size-3 text-muted-foreground" />,
  },
  {
    value: "currency",
    label: "Currency / Amount",
    icon: <DollarSign className="size-3 text-emerald-500" />,
  },
  {
    value: "date",
    label: "Date (YYYY-MM-DD)",
    icon: <Calendar className="size-3 text-sky-500" />,
  },
  {
    value: "account",
    label: "Account Number",
    icon: <Hash className="size-3 text-amber-500" />,
  },
  {
    value: "badge",
    label: "Status Badge",
    icon: <CheckCircle2 className="size-3 text-indigo-500" />,
  },
  {
    value: "number",
    label: "Numeric / Quantity",
    icon: <Hash className="size-3 text-purple-500" />,
  },
];

export function inferColumnConfig(prop: ModelProperty): InquiryColumnConfig {
  const nameLower = prop.NAME.toLowerCase();
  const propType = prop.TYPE.toLowerCase();

  let format: InquiryColumnConfig["format"] = "text";
  let align: InquiryColumnConfig["align"] = "left";
  let isMono = false;

  if (
    propType.includes("number") ||
    nameLower.includes("balance") ||
    nameLower.includes("amount") ||
    nameLower.includes("limit") ||
    nameLower.includes("rate")
  ) {
    if (
      nameLower.includes("rate") ||
      nameLower.includes("percent") ||
      nameLower.includes("count")
    ) {
      format = "number";
      align = "right";
      isMono = true;
    } else {
      format = "currency";
      align = "right";
      isMono = true;
    }
  } else if (propType.includes("date") || nameLower.includes("date") || nameLower.endsWith("at")) {
    format = "date";
    align = "center";
    isMono = true;
  } else if (
    nameLower.includes("account") ||
    nameLower.includes("accno") ||
    nameLower.endsWith("no")
  ) {
    format = "account";
    align = "left";
    isMono = true;
  } else if (
    nameLower.includes("status") ||
    nameLower.includes("state") ||
    nameLower.includes("flag")
  ) {
    format = "badge";
    align = "center";
    isMono = false;
  } else if (nameLower.includes("id") || nameLower.includes("code")) {
    format = "text";
    align = "left";
    isMono = true;
  }

  return {
    id: prop.NAME,
    label: prop.LABEL || prop.NAME,
    align,
    format,
    isMono,
    sortable: true,
    visible: true,
    isPinned: false,
  };
}

export function renderActionIcon(iconName: InquiryActionConfig["icon"]) {
  switch (iconName) {
    case "eye":
      return <Eye className="size-3 text-primary" />;
    case "edit":
      return <Edit className="size-3 text-amber-500" />;
    case "rotate-ccw":
      return <RotateCcw className="size-3 text-destructive" />;
    case "history":
      return <History className="size-3 text-purple-500" />;
    case "file-text":
      return <FileText className="size-3 text-emerald-500" />;
    case "external-link":
      return <ExternalLink className="size-3 text-sky-500" />;
    default:
      return <Eye className="size-3 text-primary" />;
  }
}
