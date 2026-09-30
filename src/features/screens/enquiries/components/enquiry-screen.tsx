"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { useWorkbenchStore } from "@/store";
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

export function EnquiryScreen({ command, tabId: _tabId, className = "" }: EnquiryScreenProps) {
  const schema = React.useMemo(() => getEnquirySchema(command), [command]);
  const { addTab } = useWorkbenchStore();

  const initialStep = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("step") === "RESULTS") return "RESULTS";
    }
    return "SELECTION";
  }, []);

  const [step, setStep] = React.useState<"SELECTION" | "RESULTS">(initialStep);
  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>(schema.sampleData);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [currentCriteria, setCurrentCriteria] = React.useState<
    Record<string, { value: string; operand: SelectionOperand }>
  >(() => {
    const initial: Record<string, { value: string; operand: SelectionOperand }> = {};
    for (const f of schema.selectionFields) {
      initial[f.id] = { value: f.value || "", operand: f.operand };
    }
    return initial;
  });

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
    setCurrentPage(1);
    setStep("RESULTS");
    toast.add({
      title: "Enquiry Executed",
      description: `Found ${result.length} matching record(s) for ${schema.code}`,
      type: "info",
    });
  };

  const handleResetFilters = () => {
    const cleared: Record<string, { value: string; operand: SelectionOperand }> = {};
    for (const f of schema.selectionFields) {
      cleared[f.id] = { value: "", operand: f.operand };
    }
    setCurrentCriteria(cleared);
    setFilteredRows(schema.sampleData);
    setCurrentPage(1);
  };

  // View individual record callback from table magnifying glass
  const handleViewRecord = (recordId: string, row: EnquiryRow) => {
    const cmd = "ACCOUNT";
    const fullCmd = `${cmd},${recordId}`;
    addTab({
      screenId: fullCmd,
      title: `${cmd} #${recordId}`,
      componentName: "DYNAMIC_FORM",
      screenMode: "VIEW",
      searchRecordId: recordId,
      formData: row as Record<string, unknown>,
    });
    toast.add({
      title: "Opening Record Details",
      description: `Viewing record #${recordId} (${schema.title})`,
      type: "info",
    });
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

  const handleExportHTML = () => {
    if (filteredRows.length === 0) {
      toast.add({
        title: "Export Failed",
        description: "No data available to export",
        type: "error",
      });
      return;
    }

    const tableHeaders = schema.columns.map((c) => `<th>${c.label}</th>`).join("");
    const tableBody = filteredRows
      .map(
        (r) =>
          `<tr>${schema.columns.map((c) => `<td>${r[c.id] ?? ""}</td>`).join("")}</tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${schema.title}</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body><h2>${schema.title} (${schema.code})</h2><table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableBody}</tbody></table></body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${schema.code.replace(/\s+/g, "_")}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.add({
      title: "HTML Export Completed",
      description: `Saved HTML report with ${filteredRows.length} records`,
      type: "success",
    });
  };

  const handleExportXML = () => {
    if (filteredRows.length === 0) {
      toast.add({
        title: "Export Failed",
        description: "No data available to export",
        type: "error",
      });
      return;
    }

    const xmlRows = filteredRows
      .map((r) => {
        const fields = schema.columns
          .map((c) => `    <${c.id}>${r[c.id] ?? ""}</${c.id}>`)
          .join("\n");
        return `  <record>\n${fields}\n  </record>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<enquiry name="${schema.code}" title="${schema.title}">\n${xmlRows}\n</enquiry>`;
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${schema.code.replace(/\s+/g, "_")}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.add({
      title: "XML Export Completed",
      description: `Exported ${filteredRows.length} records to XML`,
      type: "success",
    });
  };

  const handlePrintLocal = () => {
    window.print();
  };

  const handlePrintServer = () => {
    toast.add({
      title: "Server Print Spooled",
      description: `Enquiry report spooled to central printer for ${schema.code}`,
      type: "info",
    });
  };

  const startRecord = filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(startRecord + pageSize - 1, filteredRows.length);
  const pageRangeStr = filteredRows.length > 0 ? `${startRecord} - ${endRecord}` : "0";

  return (
    <div className={`flex flex-col h-full w-full bg-background ${className}`}>
      {/* Temenos Enquiry Header - Rendered only in results/view mode (not in idle selection mode) */}
      {step === "RESULTS" && (
        <EnquiryHeader
          title={schema.title}
          commandCode={schema.code}
          step={step}
          rowCount={filteredRows.length}
          totalCount={schema.sampleData.length > 20000 ? 24798 : filteredRows.length}
          pageRange={pageRangeStr}
          onBackToSelection={() => setStep("SELECTION")}
          onRefresh={() => {
            setFilteredRows([...schema.sampleData]);
            toast.add({
              title: "Data Refreshed",
              description: `Refreshed enquiry records for ${schema.code}`,
              type: "info",
            });
          }}
          onPrintLocal={handlePrintLocal}
          onPrintServer={handlePrintServer}
          onExportCSV={handleExportCSV}
          onExportHTML={handleExportHTML}
          onExportXML={handleExportXML}
        />
      )}

      {/* Body: Selection Filters Screen vs Enquiry Results Table */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "SELECTION" ? (
          <EnquiryFilters
            fields={schema.selectionFields}
            criteria={currentCriteria}
            onCriteriaChange={setCurrentCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
          />
        ) : (
          <EnquiryTable
            columns={schema.columns}
            rows={filteredRows}
            onViewRecord={handleViewRecord}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
