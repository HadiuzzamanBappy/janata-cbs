"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  type FilterCriteriaMap,
  InquiryFilterBar,
  InquiryTable,
} from "@/features/inquiry-engine";
import type {
  EnquiryRow,
  INQDef,
  InquiryConfigRecord,
} from "@/lib/data-schemas/inquiry-config-schema";

export interface IcPreviewTabProps {
  formData: InquiryConfigRecord;
}

function generateSampleRows(_columns: INQDef[], targetModel?: string): EnquiryRow[] {
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
      txnAmount: 450000.0,
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
      openingDate: "2023-03-22",
      interestRate: 0.0,
      branchCode: "JB0002",
      txnAmount: 1200000.0,
      inputter: "OPERATOR2",
      authorizer: "SUPV01",
      balance: 1200000.0,
      status: "ACTIVE",
    },
    {
      id: "3",
      recordId: isAccount ? "01002345680" : isUser ? "EMP00104" : "TXN987203",
      accountNumber: "01002345680",
      accountTitle: "Nasreen Sultana",
      employeeName: "Nasreen Sultana",
      empBankId: "JB00923",
      userDesignation: "Executive Officer",
      placeOfPosting: "Gulshan Corporate Br",
      mobileNo: "01911445566",
      email: "nasreen.sultana@janatabank.com.bd",
      accountType: "FIXED_DEP",
      currency: "BDT",
      openingDate: "2023-06-10",
      interestRate: 8.5,
      branchCode: "JB0005",
      txnAmount: 2500000.0,
      inputter: "OPERATOR1",
      authorizer: "MANAGER01",
      balance: 2500000.0,
      status: "DORMANT",
    },
  ];
}

export function IcPreviewTab({ formData }: IcPreviewTabProps) {
  const [step, setStep] = React.useState<"SELECTION" | "RESULTS">("RESULTS");
  const targetController = formData.INQInfo?.controllerName || "ACCOUNT";

  const sampleRows = React.useMemo(() => {
    return generateSampleRows(formData.INQDef || [], targetController);
  }, [formData.INQDef, targetController]);

  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>(sampleRows);

  React.useEffect(() => {
    setFilteredRows(sampleRows);
  }, [sampleRows]);

  const hasFilters = Boolean(formData.INQSelectField && formData.INQSelectField.length > 0);

  const handleFilterSearch = (criteria: FilterCriteriaMap) => {
    const activeFilters = Object.entries(criteria).filter(([_, c]) => c.value && c.value.trim() !== "");

    if (activeFilters.length === 0) {
      setFilteredRows(sampleRows);
    } else {
      const filtered = sampleRows.filter((row) => {
        return activeFilters.every(([fieldId, crit]) => {
          const val = String(row[fieldId] ?? "").toLowerCase();
          const target = crit.value.toLowerCase().trim();

          switch (crit.operand) {
            case "EQ":
              return val === target;
            case "LK":
            case "CT":
              return val.includes(target);
            case "NE":
              return val !== target;
            case "GT":
              return Number(val) > Number(target);
            case "LT":
              return Number(val) < Number(target);
            default:
              return true;
          }
        });
      });
      setFilteredRows(filtered);
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

  const pageSize = Number(formData.INQInfo?.perpageItem || 30) || 30;

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
              {formData.INQInfo?.description || "Inquiry Preview"}
            </span>
            <span className="text-muted-foreground/60 font-mono">&bull;</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Target: {formData.INQInfo?.controllerName || "GENERIC"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1.5 py-0.5 rounded text-primary border-primary/30 bg-primary/5 flex items-center gap-1"
          >
            <Sparkles className="size-2.5" />
            <span>LIVE PREVIEW</span>
          </Badge>

          {formData.INQCmds && formData.INQCmds.length > 0 ? (
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0.5 rounded">
              {formData.INQCmds.length} Action(s) Active
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
          <div className="p-4">
            <InquiryFilterBar
              fields={formData.INQSelectField || []}
              onSearch={handleFilterSearch}
              onReset={handleResetFilters}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
            {hasFilters && (
              <InquiryFilterBar
                fields={formData.INQSelectField || []}
                onSearch={handleFilterSearch}
                onReset={handleResetFilters}
              />
            )}
            <div className="flex-1 min-h-0">
              <InquiryTable
                columns={formData.INQDef || []}
                rows={filteredRows}
                commands={formData.INQCmds || []}
                pageSize={pageSize}
                showSerial={formData.INQInfo?.showSerial}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
