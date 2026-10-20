"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { InquiryEngineTable, InquiryFilterBuilder } from "@/features/inquiry-engine";
import type {
  EnquiryColumn,
  EnquiryRow,
  SelectionField,
  SelectionOperand,
} from "@/lib/data-schemas";
import type {
  InquiryActionConfig,
  InquiryConfigRecord,
} from "@/lib/data-schemas/inquiry-config-schema";

export interface IcPreviewTabProps {
  formData: InquiryConfigRecord;
}

function generateSampleRows(_columns: EnquiryColumn[], targetModel?: string): EnquiryRow[] {
  const isAccount = !targetModel || targetModel.toUpperCase() === "ACCOUNT";
  const isUser = targetModel?.toUpperCase() === "USER";

  return [
    {
      id: "1",
      recordId: isAccount ? "01002345678" : isUser ? "EMP00102" : "TXN987201",
      accountNumber: "01002345678",
      accountTitle: "Bashir Ahmed",
      employeeName: "Bashir Ahmed",
      empBankId: "JB00921",
      userDesignation: "Principal Officer",
      placeOfPosting: "Dilkusha Principal Br",
      mobileNo: "01711223344",
      email: "bashir.ahmed@janatabank.com.bd",
      accountType: "SAVINGS",
      currency: "BDT",
      openingDate: "2023-01-15",
      interestRate: 6.5,
      branchCode: "JB0001",
      txnAmount: "450,000.00",
      inputter: "SYSADMIN",
      authorizer: "SUPV01",
      balance: 450000.5,
      status: "ACTIVE",
    },
    {
      id: "2",
      recordId: isAccount ? "01002345679" : isUser ? "EMP00103" : "TXN987202",
      accountNumber: "01002345679",
      accountTitle: "Karim Ullah",
      employeeName: "Karim Ullah",
      empBankId: "JB00922",
      userDesignation: "Senior Officer",
      placeOfPosting: "Motijheel Corporate Br",
      mobileNo: "01811334455",
      email: "karim.ullah@janatabank.com.bd",
      accountType: "CURRENT",
      currency: "BDT",
      openingDate: "2022-08-20",
      interestRate: 0.0,
      branchCode: "JB0001",
      txnAmount: "12,500.00",
      inputter: "IA0245820",
      authorizer: "SUPV01",
      balance: 12500.0,
      status: "BLOCKED",
    },
    {
      id: "3",
      recordId: isAccount ? "01002345680" : isUser ? "EMP00104" : "TXN987203",
      accountNumber: "01002345680",
      accountTitle: "Shahidul Islam",
      employeeName: "Shahidul Islam",
      empBankId: "JB00923",
      userDesignation: "Assistant General Manager",
      placeOfPosting: "Head Office IT Div",
      mobileNo: "01911445566",
      email: "shahidul.islam@janatabank.com.bd",
      accountType: "FIXED_DEPOSIT",
      currency: "BDT",
      openingDate: "2021-05-10",
      interestRate: 8.75,
      branchCode: "JB0002",
      txnAmount: "2,340,000.75",
      inputter: "SYSUSER",
      authorizer: "SUPV02",
      balance: 2340000.75,
      status: "AUTHORIZED",
    },
    {
      id: "4",
      recordId: isAccount ? "01002345681" : isUser ? "EMP00105" : "TXN987204",
      accountNumber: "01002345681",
      accountTitle: "Fatema Begum",
      employeeName: "Fatema Begum",
      empBankId: "JB00924",
      userDesignation: "Executive Officer",
      placeOfPosting: "Gulshan Corporate Br",
      mobileNo: "01611556677",
      email: "fatema.begum@janatabank.com.bd",
      accountType: "SAVINGS",
      currency: "USD",
      openingDate: "2024-02-01",
      interestRate: 5.0,
      branchCode: "JB0005",
      txnAmount: "50,000.00",
      inputter: "IA0245820",
      authorizer: "SUPV01",
      balance: 50000.0,
      status: "ACTIVE",
    },
  ];
}

export function IcPreviewTab({ formData }: IcPreviewTabProps) {
  const hasFilters = (formData.filters || []).length > 0;

  // If there are filters, default step to "SELECTION"; otherwise go directly to "RESULTS"
  const [step, setStep] = React.useState<"SELECTION" | "RESULTS">(() =>
    hasFilters ? "SELECTION" : "RESULTS",
  );

  // Sync step if filters are added/removed dynamically
  React.useEffect(() => {
    if (!hasFilters) {
      setStep("RESULTS");
    }
  }, [hasFilters]);

  // Transform criteria selection fields
  const selectionFields: SelectionField[] = React.useMemo(
    () =>
      (formData.filters || []).map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        operand: f.defaultOperand,
        value: f.defaultValue,
        required: f.required,
      })),
    [formData.filters],
  );

  // Transform normalized columns for table
  const tableColumns: EnquiryColumn[] = React.useMemo(
    () =>
      formData.columns.map((col) => ({
        id: col.id,
        label: col.label,
        align: col.align,
        width: col.width !== undefined ? String(col.width) : undefined,
        isMono: col.isMono,
        isDrilldown: false,
      })),
    [formData.columns],
  );

  // Simulated dataset
  const sampleRows = React.useMemo(
    () =>
      generateSampleRows(
        tableColumns,
        String(formData.controllerName || formData.targetModel || "ACCOUNT"),
      ),
    [tableColumns, formData.controllerName, formData.targetModel],
  );

  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>(sampleRows);

  // Reset sample rows when model/columns change
  React.useEffect(() => {
    setFilteredRows(sampleRows);
  }, [sampleRows]);

  const handleFilterSearch = (
    criteria: Record<string, { value: string; operand: SelectionOperand }>,
  ) => {
    // Filter sample rows based on search criteria
    const activeFilters = Object.entries(criteria).filter(([_, c]) => c.value.trim() !== "");

    if (activeFilters.length === 0) {
      setFilteredRows(sampleRows);
    } else {
      const results = sampleRows.filter((row) =>
        activeFilters.every(([fieldId, c]) => {
          const rowVal = String(row[fieldId] ?? "").toLowerCase();
          const searchVal = c.value.toLowerCase().trim();
          switch (c.operand) {
            case "EQ":
              return rowVal === searchVal;
            case "LK":
            case "CT":
              return rowVal.includes(searchVal);
            case "NE":
              return rowVal !== searchVal;
            default:
              return rowVal.includes(searchVal);
          }
        }),
      );
      setFilteredRows(results);
    }

    setStep("RESULTS");
    toast.add({
      title: "Simulation Query Executed",
      description: `Matched ${filteredRows.length} simulated record(s)`,
      type: "info",
    });
  };

  const handleResetFilters = () => {
    setFilteredRows(sampleRows);
  };

  const handleExecuteAction = (action: InquiryActionConfig, recordId: string, _row: EnquiryRow) => {
    const targetModel = String(formData.controllerName || formData.targetModel || "ACCOUNT");
    toast.add({
      title: `[Simulated Action] ${action.label}`,
      description: `Target: ${action.targetCommand || `${targetModel},SEE`} (Mode: ${action.openMode}) • Record: #${recordId}`,
      type: "success",
    });
  };

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden select-none pr-1">
      {/* Simulation Control Toolbar */}
      <div className="shrink-0 flex items-center justify-between p-2 rounded border border-border/70 bg-card/70 shadow-2xs">
        <div className="flex items-center gap-2">
          {step === "RESULTS" && hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep("SELECTION")}
              className="h-6.5 text-xs px-2 gap-1 rounded bg-background"
            >
              <ArrowLeft className="size-3" /> Back to Selection
            </Button>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-foreground">
              {String(formData.description || formData.title || "Inquiry Preview")}
            </span>
            <span className="text-muted-foreground/60 font-mono">&bull;</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Target: {String(formData.controllerName || formData.targetModel || "GENERIC")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1.5 py-0.5 rounded text-primary border-primary/30 bg-primary/5 flex items-center gap-1"
          >
            <Sparkles className="size-2.5" />
            <span>LIVE SIMULATION</span>
          </Badge>

          {formData.actions && formData.actions.length > 0 ? (
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0.5 rounded">
              {formData.actions.length} Action(s) Active
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0.5 rounded text-muted-foreground"
            >
              No Actions (Table Only)
            </Badge>
          )}
        </div>
      </div>

      {/* Main Execution Stage */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "SELECTION" && hasFilters ? (
          <div className="h-full flex flex-col items-center justify-center py-4">
            <InquiryFilterBuilder
              fields={selectionFields}
              onSearch={handleFilterSearch}
              onReset={handleResetFilters}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <InquiryEngineTable
              columns={tableColumns}
              rows={filteredRows}
              actions={formData.actions || []}
              onExecuteAction={handleExecuteAction}
              pageSize={25}
            />
          </div>
        )}
      </div>
    </div>
  );
}
