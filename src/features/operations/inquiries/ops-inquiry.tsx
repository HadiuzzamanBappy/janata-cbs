"use client";

import * as React from "react";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { InquiryEngineTable, InquiryFilterBuilder } from "@/features/inquiry-engine";
import { cbs } from "@/lib/cbs-client";
import { parseInquiryRecords } from "@/lib/data-parsers";
import { type DrillRecord, InquiryDrillDown } from "./components/inquiry-drill-down";
import { InquirySkeleton } from "./components/inquiry-skeleton";
import { useInquiryActions, useInquirySchema, useInquiryState } from "./hooks";
import type { InquiryScreenProps } from "./types";
import { filterDatasetByCriteria } from "./utils/filter-dataset";

export function OpsInquiry({ command, tabId, className = "" }: InquiryScreenProps) {
  const { schema, loading, error, refetch } = useInquirySchema(command);
  const [drillRecord, setDrillRecord] = React.useState<DrillRecord | null>(null);

  const {
    step,
    setStep,
    filteredRows,
    setFilteredRows,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentCriteria,
    setCurrentCriteria,
  } = useInquiryState({ schema, tabId });

  const {
    handleViewRecord,
    handleEditRecord,
    handleExportCSV,
    handleExportHTML,
    handleExportXML,
    handleRefresh,
  } = useInquiryActions({
    schema,
    filteredRows,
    setFilteredRows,
    setDrillRecord,
  });

  const mappedActions = React.useMemo(() => {
    if (schema?.actions && schema.actions.length > 0) {
      return schema.actions;
    }
    if (!schema?.commands || schema.commands.length === 0) return undefined;
    return schema.commands.map((cmd, i) => {
      const isEdit =
        cmd.cmdButton?.toLowerCase().includes("edit") ||
        cmd.cmdButton?.toLowerCase().includes("amend");
      return {
        id: `CMD_${i}_${cmd.cmdButton}`,
        label: cmd.cmdButton,
        targetCommand: cmd.cmdFor || `${schema.code},SEE`,
        actionType: (isEdit ? "edit" : "view") as "edit" | "view",
        icon: (isEdit ? "edit" : "eye") as "edit" | "eye",
        openMode: "tab" as const,
        idParamField: "recordId",
      };
    });
  }, [schema?.actions, schema?.commands, schema?.code]);

  const handleFilterSearch = async (criteria: typeof currentCriteria) => {
    if (!schema) return;

    // Convert UI criteria into CBS inquiry queryString parameters
    const queryString = Object.entries(criteria)
      .filter(([_, c]) => c.value && c.value.trim() !== "")
      .map(([fieldId, c]) => {
        const fieldDef = schema.selectionFields.find((f) => f.id === fieldId);
        return {
          selectFieldName: fieldId,
          selectFieldType: fieldDef?.type || "text",
          selectFieldOperator: c.operand || "EQ",
          selectFieldValue: c.value.trim(),
        };
      });

    try {
      const targetControl = (schema.controllerName && schema.controllerName.trim() !== "")
        ? schema.controllerName.trim()
        : schema.code;

      const queryRes = await cbs.send<unknown>(
        cbs.inquiry.executeQuery(targetControl, {
          servicePath: schema.inqServicePath,
          perPage: pageSize || schema.perpageItem || 1000,
          curPage: 1,
          queryString,
        }),
        { silent: true },
      );

      const dataset = parseInquiryRecords(queryRes.data);

      setCurrentCriteria(criteria);
      setFilteredRows(dataset);
      setCurrentPage(1);
      setStep("RESULTS");

      toast.add({
        title: "Query Executed",
        description: `Matched ${dataset.length} record(s)`,
        type: "info",
      });
    } catch (err) {
      console.warn("Dynamic inquiry query failed", err);
      // Fallback to local memory filtering on sample data if available
      const fallbackDataset = filterDatasetByCriteria(schema.sampleData || [], criteria);
      setCurrentCriteria(criteria);
      setFilteredRows(fallbackDataset);
      setCurrentPage(1);
      setStep("RESULTS");

      toast.add({
        title: "Query Fallback",
        description: `Backend query failed. Matched ${fallbackDataset.length} local records.`,
        type: "warning",
      });
    }
  };

  const handleResetFilters = () => {
    if (!schema) return;
    const initialCriteria: typeof currentCriteria = {};
    for (const f of schema.selectionFields) {
      initialCriteria[f.id] = { value: "", operand: f.operand };
    }
    setCurrentCriteria(initialCriteria);
    setFilteredRows(schema.sampleData || []);
    setCurrentPage(1);
  };

  if (loading) {
    return <InquirySkeleton />;
  }

  if (error || !schema) {
    return (
      <CbsErrorState
        title="Failed to Load Command Schema"
        message={error || `No schema found for "${command}"`}
        command={command}
        onRetry={refetch}
        className={className}
      />
    );
  }

  if (drillRecord) {
    return (
      <InquiryDrillDown
        drillRecord={drillRecord}
        schemaTitle={schema.title}
        onReturn={() => setDrillRecord(null)}
        className={className}
      />
    );
  }

  return (
    <CbsScreenScaffold
      title={schema.title}
      commandCode={schema.code}
      variant="inquiry"
      inquiryStep={step}
      onInquiryBackToSelection={() => setStep("SELECTION")}
      onInquiryRefresh={handleRefresh}
      onInquiryPrintLocal={() => window.print()}
      onInquiryPrintServer={() =>
        toast.add({
          title: "Server Print Spooled",
          description: `Report spooled for ${schema.code}`,
          type: "info",
        })
      }
      onInquiryExportCSV={handleExportCSV}
      onInquiryExportHTML={handleExportHTML}
      onInquiryExportXML={handleExportXML}
      className={className}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {step === "SELECTION" ? (
          <InquiryFilterBuilder
            fields={schema.selectionFields}
            criteria={currentCriteria}
            onCriteriaChange={setCurrentCriteria}
            onSearch={handleFilterSearch}
            onReset={handleResetFilters}
          />
        ) : (
          <InquiryEngineTable
            columns={schema.columns}
            rows={filteredRows}
            actions={mappedActions}
            onViewRecord={handleViewRecord}
            onEditRecord={handleEditRecord}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </CbsScreenScaffold>
  );
}

export const InquiryScreen = OpsInquiry;
