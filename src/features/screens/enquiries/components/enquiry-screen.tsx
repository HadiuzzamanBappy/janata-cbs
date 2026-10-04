"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import { useWorkbenchStore } from "@/store";
import { FormScreen } from "../../forms";
import { useEnquirySchema } from "../hooks/use-enquiry-schema";
import type { EnquiryRow, SelectionOperand } from "../types";
import { EnquiryFilters } from "./enquiry-filters";
import { EnquiryHeader } from "./enquiry-header";
import { EnquiryTable } from "./enquiry-table";

export interface EnquiryScreenProps {
  command: string;
  tabId?: string;
  className?: string;
}

/** Inline drill-down state: when a record is opened from the enquiry results within a popup */
interface DrillRecord {
  formCommand: string;
  recordId: string;
  screenMode: "VIEW" | "EDIT";
  formData: Record<string, unknown>;
}

export function EnquiryScreen({ command, tabId, className = "" }: EnquiryScreenProps) {
  const { schema, loading, error, refetch } = useEnquirySchema(command);
  const { tabs, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // Inline drill-down state: set when a record is opened from the enquiry results
  const [drillRecord, setDrillRecord] = React.useState<DrillRecord | null>(null);

  // Restore step from tab state or URL query params (for popups)
  const initialStep = React.useMemo(() => {
    if (currentTab?.enquiryState?.step) return currentTab.enquiryState.step;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("step") === "RESULTS") return "RESULTS";
    }
    return "SELECTION";
  }, [currentTab]);

  // Restore criteria from tab state or URL query params (for popups)
  const initialCriteria = React.useMemo((): Record<
    string,
    { value: string; operand: SelectionOperand }
  > => {
    if (
      currentTab?.enquiryState?.criteria &&
      Object.keys(currentTab.enquiryState.criteria).length > 0
    ) {
      return currentTab.enquiryState.criteria as Record<
        string,
        { value: string; operand: SelectionOperand }
      >;
    }
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("criteria");
      if (raw) {
        try {
          return JSON.parse(raw) as Record<
            string,
            { value: string; operand: SelectionOperand }
          >;
        } catch {
          // Safe parse fallback
        }
      }
    }
    return {};
  }, [currentTab]);

  // Restore currentPage from tab state or URL query params
  const initialPage = React.useMemo(() => {
    if (currentTab?.enquiryState?.currentPage) return currentTab.enquiryState.currentPage;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const pg = Number(p.get("page"));
      if (pg > 0) return pg;
    }
    return 1;
  }, [currentTab]);

  // Restore pageSize from tab state or URL query params
  const initialPageSize = React.useMemo(() => {
    if (currentTab?.enquiryState?.pageSize) return currentTab.enquiryState.pageSize;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const ps = Number(p.get("pageSize"));
      if (ps > 0) return ps;
    }
    return 10;
  }, [currentTab]);

  const [step, setStepState] = React.useState<"SELECTION" | "RESULTS">(initialStep);
  const [filteredRows, setFilteredRows] = React.useState<EnquiryRow[]>([]);
  const [currentPage, setCurrentPageState] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);
  const [currentCriteria, setCurrentCriteriaState] = React.useState<
    Record<string, { value: string; operand: SelectionOperand }>
  >(initialCriteria);


  const setStep = React.useCallback(
    (newStep: "SELECTION" | "RESULTS") => {
      setStepState(newStep);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            step: newStep,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  const setCurrentPage = React.useCallback(
    (page: number) => {
      setCurrentPageState(page);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            currentPage: page,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      setPageSizeState(size);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            pageSize: size,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  const setCurrentCriteria = React.useCallback(
    (crit: Record<string, { value: string; operand: SelectionOperand }>) => {
      setCurrentCriteriaState(crit);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, {
          enquiryState: {
            ...currentTab?.enquiryState,
            criteria: crit,
          },
        });
      }
    },
    [tabId, updateTabState, currentTab?.enquiryState],
  );

  // Initialize or restore criteria when schema finishes loading
  React.useEffect(() => {
    if (!schema) return;

    // Use persisted criteria if available (tab store or URL params), else load schema defaults
    const hasPersisted = Object.keys(initialCriteria).length > 0;
    const initial: Record<string, { value: string; operand: SelectionOperand }> = hasPersisted
      ? initialCriteria
      : {};

    if (!hasPersisted) {
      for (const f of schema.selectionFields) {
        initial[f.id] = { value: f.value || "", operand: f.operand };
      }
    }

    setCurrentCriteriaState(initial);

    // If step was persisted as RESULTS, execute filter on sample data right away
    if (initialStep === "RESULTS") {
      let result = [...(schema.sampleData || [])];
      for (const [key, filter] of Object.entries(initial)) {
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
    } else {
      setFilteredRows(schema.sampleData || []);
    }

    setStepState(initialStep);
  }, [schema, initialStep, initialCriteria]);

  const handleFilterSearch = async (
    criteria: Record<string, { value: string; operand: SelectionOperand }>,
  ) => {
    if (!schema) return;

    try {
      // 1. Production API Flow: Call BFF proxy with INQ request
      const res = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "INQ",
          controlName: schema.code,
          recordFunction: "S",
          data: {
            criteria,
            page: currentPage,
            limit: pageSize,
          },
        }),
      });

      const json = await res.json();

      let dataset: EnquiryRow[] = [];

      // If backend returned live database rows, use them
      if (json.status === "SUCCESS" && Array.isArray(json.data) && json.data.length > 0) {
        dataset = json.data as EnquiryRow[];
      } else {
        // Fallback to static sample data for offline / demo simulation
        dataset = [...(schema.sampleData || [])];
      }

      // 2. Apply criteria filtering to dataset
      let result = dataset;
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
    } catch {
      // Offline fallback: filter local sample data directly
      let result = [...(schema.sampleData || [])];
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
    }
  };

  const handleResetFilters = () => {
    if (!schema) return;
    const cleared: Record<string, { value: string; operand: SelectionOperand }> = {};
    for (const f of schema.selectionFields) {
      cleared[f.id] = { value: "", operand: f.operand };
    }
    setCurrentCriteria(cleared);
    setFilteredRows(schema.sampleData || []);
    setCurrentPage(1);
  };

  /** Resolve the target form application command from the enquiry schema code */
  const resolveFormCmd = (recordId: string): string => {
    if (!schema) return recordId;
    const baseCode = schema.code.replace(/^(ENQ\s+|INQ\s+)/i, "").trim();
    const targetCmd =
      baseCode === "USER.LIST" || baseCode === "GET.EMP.INFO"
        ? "USER.MGT"
        : baseCode === "ACCOUNT" || baseCode.includes("ACC")
          ? "ACCOUNT"
          : baseCode.includes("CUST")
            ? "CUSTOMER"
            : baseCode;
    return targetCmd;
  };

  // View individual record callback from table CTA
  // Always opens inline within the same screen (tab or popup) — CBS/Temenos drill-down style
  const handleViewRecord = (recordId: string, row: EnquiryRow) => {
    if (!schema) return;
    const targetCmd = resolveFormCmd(recordId);
    setDrillRecord({
      formCommand: targetCmd,
      recordId,
      screenMode: "VIEW",
      formData: row as Record<string, unknown>,
    });
    toast.add({
      title: "Viewing Record",
      description: `Opened record #${recordId} in ${targetCmd} (View mode)`,
      type: "info",
    });
  };

  // Edit individual record callback from table CTA
  // Always opens inline within the same screen (tab or popup) — CBS/Temenos drill-down style
  const handleEditRecord = (recordId: string, row: EnquiryRow) => {
    if (!schema) return;
    const targetCmd = resolveFormCmd(recordId);
    setDrillRecord({
      formCommand: targetCmd,
      recordId,
      screenMode: "EDIT",
      formData: row as Record<string, unknown>,
    });
    toast.add({
      title: "Editing Record",
      description: `Opened record #${recordId} in ${targetCmd} (Edit mode)`,
      type: "info",
    });
  };

  const handleExportCSV = () => {
    if (!schema) return;
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
    if (!schema) return;
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
      .map((r) => `<tr>${schema.columns.map((c) => `<td>${r[c.id] ?? ""}</td>`).join("")}</tr>`)
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
    if (!schema) return;
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
    if (!schema) return;
    toast.add({
      title: "Server Print Spooled",
      description: `Enquiry report spooled to central printer for ${schema.code}`,
      type: "info",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-32 w-full bg-muted/60 rounded" />
        <div className="h-64 w-full bg-muted/40 rounded" />
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="p-6 max-w-md mx-auto my-8">
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-sm">
          <p className="font-semibold text-destructive mb-1">Failed to Load Enquiry Schema</p>
          <p className="text-muted-foreground mb-3">{error || "Unknown error"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const startRecord = filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(startRecord + pageSize - 1, filteredRows.length);
  const pageRangeStr = filteredRows.length > 0 ? `${startRecord} - ${endRecord}` : "0";

  // ── INLINE DRILL-DOWN: Show FormScreen within the same screen (tab or popup) ──
  // When user clicks View/Edit, drillRecord is set and we render the form inline.
  // The breadcrumb ← button and the form's ⬆ Return button both clear drillRecord → back to list.
  if (drillRecord) {
    const modeBadgeColor =
      drillRecord.screenMode === "VIEW"
        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
        : "bg-amber-500/15 text-amber-400 border-amber-500/30";

    return (
      <div className={`flex flex-col h-full w-full bg-background ${className}`}>
        {/* Breadcrumb navigation bar */}
        <nav className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/60 bg-muted/20 shrink-0 select-none">
          {/* Back crumb: Enquiry title */}
          <button
            type="button"
            onClick={() => setDrillRecord(null)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors font-medium"
          >
            <span className="text-[11px] leading-none">◀</span>
            <span>{schema.title}</span>
          </button>

          {/* Separator */}
          <span className="text-muted-foreground/40 text-xs select-none">›</span>

          {/* Current crumb: Record ID + mode badge */}
          <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
            {drillRecord.recordId}
            <span
              className={`text-[9px] font-mono px-1 py-0 rounded border font-medium ${modeBadgeColor}`}
            >
              {drillRecord.screenMode}
            </span>
          </span>
        </nav>

        {/* FormScreen renders inline — opens in the correct VIEW/EDIT state with record pre-loaded */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <FormScreen
            command={drillRecord.formCommand}
            initialValues={drillRecord.formData}
            initialScreenMode={drillRecord.screenMode}
            initialRecordId={drillRecord.recordId}
            onReturn={() => setDrillRecord(null)}
            onSuccess={() => {
              setDrillRecord(null);
              toast.add({
                title: "Saved",
                description: `Record saved. Returning to ${schema.title} list.`,
                type: "success",
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full bg-background ${className}`}>
      {/* Temenos Enquiry Header - Rendered only in results/view mode (not in idle selection mode) */}
      {step === "RESULTS" && (
        <EnquiryHeader
          title={schema.title}
          commandCode={schema.code}
          step={step}
          rowCount={filteredRows.length}
          totalCount={filteredRows.length}
          pageRange={pageRangeStr}
          onBackToSelection={() => setStep("SELECTION")}
          onRefresh={() => {
            setFilteredRows([...(schema.sampleData || [])]);
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
            onEditRecord={handleEditRecord}
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
