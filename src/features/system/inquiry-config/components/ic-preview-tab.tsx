"use client";

import * as React from "react";
import { InquiryEngineTable } from "@/features/inquiry-engine";
import type { InquiryColumnConfig } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcPreviewTabProps {
  columns: InquiryColumnConfig[];
}

const SAMPLE_PREVIEW_ROWS = [
  {
    id: "1",
    accountNo: "01002345678",
    title: "Bashir Ahmed",
    balance: 450000.5,
    status: "ACTIVE",
    accountType: "SAVINGS",
    branchCode: "JB0001",
  },
  {
    id: "2",
    accountNo: "01002345679",
    title: "Karim Ullah",
    balance: 12500.0,
    status: "BLOCKED",
    accountType: "CURRENT",
    branchCode: "JB0001",
  },
  {
    id: "3",
    accountNo: "01002345680",
    title: "Shahidul Islam",
    balance: 2340000.75,
    status: "AUTHORIZED",
    accountType: "FIXED_DEPOSIT",
    branchCode: "JB0002",
  },
];

export function IcPreviewTab({ columns }: IcPreviewTabProps) {
  const normalizedColumns = React.useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        label: col.label,
        align: col.align,
        width: col.width !== undefined ? String(col.width) : undefined,
        isMono: col.isMono,
      })),
    [columns],
  );

  return (
    <div className="flex-1 overflow-hidden mt-2">
      <InquiryEngineTable columns={normalizedColumns} rows={SAMPLE_PREVIEW_ROWS} />
    </div>
  );
}
