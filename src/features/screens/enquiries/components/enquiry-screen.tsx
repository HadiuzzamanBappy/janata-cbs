"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { getEnquirySchema } from "../schemas";
import type { EnquiryRow, SelectionOperand } from "../types";
import { EnquiryFilters } from "./enquiry-filters";
import { EnquiryHeader } from "./enquiry-header";
import { EnquiryTable } from "./enquiry-table";

export interface EnquiryScreenProps {
  command: string;
  tabId?: string;
  className?: string;
}

export function EnquiryScreen({ command, className = "" }: EnquiryScreenProps) {
  const schema = React.useMemo(() => getEnquirySchema(command), [command]);

  const initialStep = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("step") === "RESULTS") return "RESULTS";
    }
    return "SELECTION";
  }, []);

  const [step, setStep] = React.useState<"SELECTION" | "RESULTS">(initialStep);
  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>(schema.sampleData);

  React.useEffect(() => {
    setFilteredRows(schema.sampleData);
    setStep(initialStep);
  }, [schema, initialStep]);

  const handleFilterSearch = (
    criteria: Record<string, { value: string; operand: SelectionOperand }>,
  ) => {
    let result = [...schema.sampleData];

    for (const [key, filter] of Object.entries(criteria)) {
      if (!filter.value.trim()) continue;
      const term = filter.value.trim().toLowerCase();

      result = result.filter((row) => {
        const val = String(row[key] ?? "").toLowerCase();
        if (filter.operand === "EQ") return val === term;
        if (filter.operand === "NE") return val !== term;
        return val.includes(term);
      });
    }

    setFilteredRows(result);
    setStep("RESULTS");
    toast.add({
      title: "Enquiry Executed",
      description: `Found ${result.length} matching record(s) for ${schema.code}`,
      type: "info",
    });
  };

  const handleResetFilters = () => {
    setFilteredRows(schema.sampleData);
  };

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.add({
        title: "Export Failed",
        description: "No data available to export",
        type: "error",
      });
      return;
    }

    const headers = schema.columns.map((c) => c.label).join(",");
    const rowsCSV = filteredRows
      .map((row) => schema.columns.map((c) => `"${row[c.id] ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([`${headers}\n${rowsCSV}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${schema.code.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.add({
      title: "Export Completed",
      description: `Exported ${filteredRows.length} rows to CSV`,
      type: "success",
    });
  };

  return (
    <div className={`flex flex-col h-full w-full bg-background ${className}`}>
      {/* Temenos Enquiry Specific Header - Only shown when results are rendered */}
      {step === "RESULTS" && (
        <EnquiryHeader
          title={schema.title}
          commandCode={schema.code}
          step={step}
          rowCount={filteredRows.length}
          onBackToSelection={() => setStep("SELECTION")}
          onRefresh={() => {
            setFilteredRows([...schema.sampleData]);
            toast.add({
              title: "Data Refreshed",
              description: `Refreshed enquiry records for ${schema.code}`,
              type: "info",
            });
          }}
          onExportCSV={handleExportCSV}
        />
      )}

      {/* Step 1: Selection Screen vs Step 2: Enquiry Results Table */}
      {step === "SELECTION" ? (
        <EnquiryFilters
          fields={schema.selectionFields}
          onSearch={handleFilterSearch}
          onReset={handleResetFilters}
        />
      ) : (
        <EnquiryTable columns={schema.columns} rows={filteredRows} />
      )}
    </div>
  );
}
