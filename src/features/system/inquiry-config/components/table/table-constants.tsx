import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Hash,
  Type,
} from "lucide-react";
import type * as React from "react";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export const CBS_TYPE_OPTIONS: Array<{
  value: string;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "CH",
    label: "Character / Text (CH)",
    icon: <Type className="size-3 text-muted-foreground" />,
  },
  {
    value: "AM",
    label: "Amount / Currency (AM)",
    icon: <DollarSign className="size-3 text-emerald-500" />,
  },
  {
    value: "DT",
    label: "Date (DT)",
    icon: <Calendar className="size-3 text-sky-500" />,
  },
  {
    value: "NR",
    label: "Numeric / Integer (NR)",
    icon: <Hash className="size-3 text-amber-500" />,
  },
  {
    value: "BDG",
    label: "Status Badge (BDG)",
    icon: <CheckCircle2 className="size-3 text-indigo-500" />,
  },
  {
    value: "ACC",
    label: "Account Number (ACC)",
    icon: <Hash className="size-3 text-cyan-500" />,
  },
];

export const CBS_ALIGN_OPTIONS = [
  { value: "L", label: "Left (L)" },
  { value: "R", label: "Right (R)" },
  { value: "C", label: "Center (C)" },
];

/**
 * Infers canonical INQDef column settings directly from a ModelProperty.
 */
export function inferInqDefFromModelProperty(prop: ModelProperty, order: number): INQDef {
  const pType = (prop.TYPE || "Text").toLowerCase();
  let fieldType = "CH";
  let align = "L";
  let len = prop.LENGTH || 20;

  if (pType === "amount" || pType === "number") {
    fieldType = pType === "amount" ? "AM" : "NR";
    align = "R";
    len = 15;
  } else if (pType === "date") {
    fieldType = "DT";
    align = "C";
    len = 12;
  } else if (prop.NAME.toLowerCase().includes("status")) {
    fieldType = "BDG";
    align = "C";
    len = 10;
  } else if (prop.NAME.toLowerCase().includes("account")) {
    fieldType = "ACC";
    align = "L";
    len = 18;
  }

  return {
    fieldName: prop.NAME,
    fieldDisplay: prop.LABEL || prop.NAME,
    fieldType,
    fieldLength: `${len},${align}`,
    fieldRowCol: `1,${order}`,
    fieldFunc: "",
    dataPassable: null,
  };
}
