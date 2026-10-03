"use client";

import { AlertTriangle, Layers } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import { useWorkbenchStore } from "@/store";
import { useFormSchema } from "../hooks/use-form-schema";
import { useFormState } from "../hooks/use-form-state";
import type { DynamicFormProps } from "../types";
import { STATIC_TABLE_DATA } from "@fixtures";
import { FormGrid } from "./form-grid";
import { FormHeader, type MoreActionItem } from "./form-header";
import { FormSkeleton } from "./form-skeleton";

const EMPTY_INITIAL_VALUES: Record<string, unknown> = {};

function getDefaultMoreActions(code: string): MoreActionItem[] {
  return [
    {
      label: "List Live File",
      onClick: () =>
        toast.add({
          title: "Enquiry",
          description: `Listing active live records for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List Unauth File",
      onClick: () =>
        toast.add({
          title: "Enquiry",
          description: `Listing unauthorized records for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List History File",
      onClick: () =>
        toast.add({
          title: "Enquiry",
          description: `Fetching history records for ${code}`,
          type: "info",
        }),
      requiredRight: "R",
    },
    {
      label: "Search Live File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Live File search dialog for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "Search Unauth File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Unauthorized File search dialog for ${code}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "Customer Positions",
      onClick: () =>
        toast.add({
          title: "Customer Enquiry",
          description: "Fetching overall customer positions summary",
          type: "info",
        }),
      requiredRight: "R",
    },
    {
      label: "Account List",
      onClick: () =>
        toast.add({
          title: "Account Enquiry",
          description: "Retrieving account list",
          type: "info",
        }),
      requiredRight: "R",
    },
  ];
}

export type FormScreenProps = DynamicFormProps & {
  initialValues?: Record<string, unknown>;
  /** Optional override for the ⬆ Return action — used by inline popup drill-down to go back to the enquiry list */
  onReturn?: () => void;
};

export function FormScreen({
  command,
  tabId,
  initialValues = EMPTY_INITIAL_VALUES,
  onSuccess,
  onReturn,
}: FormScreenProps) {
  const { schema, loading, error, refetch } = useFormSchema(command);
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // Read persisted screenMode and searchRecordId from tab state or URL query params (for popups)
  const initialMode = React.useMemo(() => {
    if (currentTab?.screenMode) return currentTab.screenMode;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const modeParam = p.get("mode");
      if (
        modeParam === "CREATE" ||
        modeParam === "EDIT" ||
        modeParam === "VIEW" ||
        modeParam === "IDLE"
      ) {
        return modeParam;
      }
    }
    return "IDLE";
  }, [currentTab]);

  const initialRecordId = React.useMemo(() => {
    if (currentTab?.searchRecordId) return currentTab.searchRecordId;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("recordId") || "";
    }
    return "";
  }, [currentTab]);

  const [screenMode, setScreenModeState] = React.useState<"IDLE" | "CREATE" | "EDIT" | "VIEW">(
    initialMode,
  );
  const [searchRecordId, setSearchRecordIdState] = React.useState<string>(initialRecordId);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const setScreenMode = React.useCallback(
    (mode: "IDLE" | "CREATE" | "EDIT" | "VIEW") => {
      setScreenModeState(mode);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { screenMode: mode });
      }
    },
    [tabId, updateTabState],
  );

  const setSearchRecordId = React.useCallback(
    (id: string) => {
      setSearchRecordIdState(id);
      if (tabId && typeof updateTabState === "function") {
        updateTabState(tabId, { searchRecordId: id });
      }
    },
    [tabId, updateTabState],
  );

  // Use the full invocation command if versioned (e.g. "USER.MGT,NEW1"), else schema.code
  const displayCommandCode = React.useMemo(() => {
    if (command && command.includes(",")) {
      const parts = command.split(",");
      // If version syntax like "USER.MGT,NEW1"
      if (parts[1] && !parts[1].match(/^\d+$/) && isNaN(Number(parts[1]))) {
        return command.trim().toUpperCase();
      }
    }
    return schema?.code || command;
  }, [command, schema?.code]);

  // Merge initialValues with saved tab draft data or URL query params (for popups)
  const urlFormData = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("data");
      if (raw) {
        try {
          return JSON.parse(raw) as Record<string, unknown>;
        } catch {
          // Safe parse fallback
        }
      }
    }
    return {};
  }, []);

  const mergedInitialValues = React.useMemo(() => {
    return { ...initialValues, ...urlFormData, ...currentTab?.formData };
  }, [initialValues, urlFormData, currentTab?.formData]);

  const { values, errors, setValue, validate, resetForm, setValues } = useFormState(
    schema,
    mergedInitialValues,
  );

  // Helper to map and normalize incoming enquiry row / raw DB records to match current schema fields
  const normalizeRecordData = React.useCallback(
    (raw: Record<string, unknown>, targetSchema: typeof schema): Record<string, unknown> => {
      if (!targetSchema || !raw) return raw || {};
      const result: Record<string, unknown> = { ...raw };

      // Helper to strip non-alphanumeric chars for fuzzy matching
      const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Known semantic aliases across enquiry columns and form schema fields
      const semanticMap: Record<string, string[]> = {
        "user.id": ["userid", "empid", "id", "employeeid", "user_id"],
        "full.name": ["fullname", "empname", "name", "employeename", "name1", "full_name"],
        "role": ["role", "userrole", "designation", "user_role"],
        "branch": ["branch", "branchcode", "branch_code"],
        "customer.id": ["customerid", "custid", "id", "customer_id"],
        "name.1": ["name1", "name", "customername", "fullname", "shortname"],
        "account.title": ["accounttitle", "title", "customername", "name"],
        "status": ["status", "recordstatus", "record_status"],
      };

      for (const field of targetSchema.fields) {
        // If field already has a value, preserve it
        if (result[field.name] !== undefined && result[field.name] !== null && result[field.name] !== "") {
          continue;
        }

        const simplifiedFieldName = simplify(field.name);
        const aliases = semanticMap[field.name.toLowerCase()] || [simplifiedFieldName];

        // 1. Look for direct or alias matches in raw record
        for (const [k, v] of Object.entries(raw)) {
          if (v === undefined || v === null || v === "") continue;
          const simplifiedKey = simplify(k);
          if (simplifiedKey === simplifiedFieldName || aliases.includes(simplifiedKey)) {
            result[field.name] = v;
            break;
          }
        }
      }

      return result;
    },
    [],
  );

  // Load record from database (or mock database) when in VIEW or EDIT mode with a recordId
  const loadRecordData = React.useCallback(
    async (recordIdToLoad: string, modeToSet: "EDIT" | "VIEW") => {
      if (!schema || !recordIdToLoad.trim()) return;

      const cleanModel = schema.code.toUpperCase();
      const cleanId = recordIdToLoad.trim();

      // Check static database records fixture first (check target model or any alias model)
      const modelTable = STATIC_TABLE_DATA[cleanModel];
      let foundRecord = modelTable?.records?.[cleanId];

      // If not directly in target table, check other tables for matching record ID
      if (!foundRecord) {
        for (const tbl of Object.values(STATIC_TABLE_DATA)) {
          if (tbl.records?.[cleanId]) {
            foundRecord = tbl.records[cleanId];
            break;
          }
        }
      }

      if (foundRecord) {
        const normalized = normalizeRecordData(foundRecord, schema);
        setValues(normalized);
        setScreenMode(modeToSet);
        toast.add({
          title: modeToSet === "VIEW" ? "Viewing Record" : "Editing Record",
          description: `Loaded record #${cleanId} for ${schema.title}`,
          type: "success",
        });
        return;
      }

      // If not in static fixtures, query the live backend via proxy
      try {
        const res = await fetch(appConfig.routes.api.proxy, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "INQ",
            controlName: schema.code,
            recordFunction: "S",
            recordId: cleanId,
          }),
        });

        const json = await res.json();
        if (json.status === "SUCCESS" && json.data) {
          const normalized = normalizeRecordData(json.data, schema);
          setValues(normalized);
          setScreenMode(modeToSet);
        } else {
          toast.add({
            title: "Record Not Found",
            description: `Record #${cleanId} does not exist in ${schema.title}.`,
            type: "warning",
          });
        }
      } catch {
        // Fallback to empty record
        setScreenMode(modeToSet);
      }
    },
    [schema, setScreenMode, setValues, normalizeRecordData],
  );

  // Auto-populate & synchronize record when schema loads or searchRecordId / formData changes
  React.useEffect(() => {
    if (!schema) return;

    const cleanModel = schema.code.toUpperCase();
    const cleanId = (searchRecordId || "").trim();

    // 1. Try finding existing record in fixtures
    let found = cleanId ? STATIC_TABLE_DATA[cleanModel]?.records?.[cleanId] : undefined;
    if (!found && cleanId) {
      for (const tbl of Object.values(STATIC_TABLE_DATA)) {
        if (tbl.records?.[cleanId]) {
          found = tbl.records[cleanId];
          break;
        }
      }
    }

    // 2. Or fallback to row data passed via tab.formData
    const rawData = found || (currentTab?.formData as Record<string, unknown>) || undefined;

    if (rawData && Object.keys(rawData).length > 0) {
      const normalized = normalizeRecordData(rawData, schema);
      // Ensure record ID is set on appropriate key if missing
      if (cleanId) {
        const idField = schema.fields.find(
          (f) =>
            f.name.toUpperCase().includes("ID") ||
            f.name.toUpperCase().includes("CODE") ||
            f.name.toUpperCase().includes("NUMBER"),
        );
        if (idField && !normalized[idField.name]) {
          normalized[idField.name] = cleanId;
        }
      }

      setValues(normalized);

      if (screenMode === "CREATE" && found) {
        // Record already exists: switch to EDIT mode and notify
        setScreenMode("EDIT");
        toast.add({
          title: "Existing Record Found",
          description: `Record #${cleanId} already exists. Loaded in Edit mode.`,
          type: "info",
        });
      }
    } else if (cleanId) {
      // Record does not exist: populate ID into the target ID field in CREATE mode
      const idField = schema.fields.find(
        (f) =>
          f.name.toUpperCase().includes("ID") ||
          f.name.toUpperCase().includes("CODE") ||
          f.name.toUpperCase().includes("NUMBER"),
      );
      if (idField) {
        setValue(idField.name, cleanId);
      }
    }
  }, [schema, searchRecordId, currentTab?.formData, screenMode, setValues, setValue, setScreenMode, normalizeRecordData]);

  const handleFieldChange = (name: string, val: unknown) => {
    setValue(name, val);
    if (tabId) {
      updateFormData(tabId, { [name]: val });
      if (typeof updateTabState === "function") {
        updateTabState(tabId, { isDirty: true });
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.add({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        type: "warning",
      });
      return;
    }

    if (!schema) return;

    setSubmitting(true);
    try {
      const res = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "PUT",
          controlName: schema.code,
          recordFunction: "I",
          recordId: "",
          data: values,
        }),
      });

      if (res.status === 401) {
        toast.add({
          title: "Session Expired",
          description: "Your session has expired. Please re-login on the main dashboard tab and submit again.",
          type: "error",
        });
        return;
      }

      const json = await res.json();
      if (res.ok && json.status === "SUCCESS") {
        toast.add({
          title: "Transaction Saved",
          description: json.message || `Record saved successfully for ${schema.title}`,
          type: "success",
        });
        if (onSuccess) onSuccess(json);
      } else {
        toast.add({
          title: "Transaction Failed",
          description: json.message || "Failed to execute transaction",
          type: "error",
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.add({
        title: "Network Error",
        description: error?.message || "Communication failed",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  if (error || !schema) {
    return (
      <div className="p-6 max-w-md mx-auto my-8">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle className="text-xs font-semibold">Failed to Load Command Schema</AlertTitle>
          <AlertDescription className="mt-1.5 flex flex-col gap-3">
            <p className="text-xs opacity-90">{error || `No schema found for "${command}"`}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={refetch}
              className="w-fit text-xs h-7 px-2.5"
            >
              Retry Fetching Schema
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <FormHeader
        title={schema.title}
        commandCode={displayCommandCode}
        mode={screenMode}
        recordId={searchRecordId}
        onRecordIdChange={setSearchRecordId}
        onRecordSearch={(query) => {
          // Keep screen in current mode while user searches / filters
          toast.add({
            title: "Searching Records",
            description: `Filtering records matching "${query}"`,
            type: "info",
          });
        }}
        onCreateNew={() => {
          resetForm(initialValues);
          setScreenMode("CREATE");
          toast.add({
            title: "New Record Entry",
            description: searchRecordId.trim()
              ? `Creating new entry with ID #${searchRecordId.trim()} for ${schema.title}`
              : `Ready to input new transaction for ${schema.title}`,
            type: "info",
          });
        }}
        onAmend={() => {
          const id = searchRecordId.trim();
          if (!id) {
            toast.add({
              title: "Input Required",
              description: "Please enter or select a Record ID to edit.",
              type: "warning",
            });
            return;
          }

          loadRecordData(id, "EDIT");
        }}
        onView={() => {
          const id = searchRecordId.trim();
          if (!id) {
            toast.add({
              title: "Input Required",
              description: "Please enter or select a Record ID to view.",
              type: "warning",
            });
            return;
          }

          loadRecordData(id, "VIEW");
        }}
        onPerformAction={() => {
          const id = searchRecordId.trim();
          if (!id) {
            toast.add({
              title: "Input Required",
              description: "Please enter or select a Record ID to perform action.",
              type: "warning",
            });
            return;
          }

          loadRecordData(id, "EDIT");
        }}
        onHold={
          screenMode !== "IDLE"
            ? () => {
                toast.add({
                  title: "Transaction Held",
                  description: `Record draft for ${schema.title} placed on Hold (HLD status).`,
                  type: "info",
                });
              }
            : undefined
        }
        onDelete={
          screenMode !== "IDLE"
            ? () => {
                toast.add({
                  title: "Record Reversal Queued",
                  description: `Transaction marked for reversal/deletion in ${schema.title}.`,
                  type: "warning",
                });
              }
            : undefined
        }
        onAuthorizeReverse={
          screenMode !== "IDLE"
            ? () => {
                toast.add({
                  title: "Authorize Reversal",
                  description: `Authorizing transaction reversal for record #${searchRecordId || "CURRENT"}.`,
                  type: "warning",
                });
              }
            : undefined
        }
        onProcessAction={
          screenMode !== "IDLE"
            ? () => {
                toast.add({
                  title: "Process / Verify Record",
                  description: `Executing verification & end-of-stage process for ${schema.title}.`,
                  type: "success",
                });
              }
            : undefined
        }
        onReturnToSearch={() => {
          if (onReturn) {
            // In popup inline drill-down: delegate back to enquiry list
            onReturn();
            return;
          }
          resetForm(initialValues);
          setScreenMode("IDLE");
          toast.add({
            title: "Returned to Search",
            description: "Returned to initial dashboard / lookup state.",
            type: "info",
          });
        }}
        onReset={screenMode !== "IDLE" ? () => resetForm(initialValues) : undefined}
        onSubmit={screenMode !== "IDLE" ? handleSubmit : undefined}
        onValidate={
          screenMode !== "IDLE"
            ? () => {
                toast.add({
                  title: "Validation Check Passed",
                  description: `Onsite & DB rules validated for ${schema.title}`,
                  type: "success",
                });
              }
            : undefined
        }
        submitting={submitting}
        availableItems={
          STATIC_TABLE_DATA[schema.code.toUpperCase()]
            ? Object.keys(STATIC_TABLE_DATA[schema.code.toUpperCase()].records).map((recId) => {
                const rec = STATIC_TABLE_DATA[schema.code.toUpperCase()].records[recId];
                const label =
                  (rec["ACCOUNT.TITLE"] as string) ||
                  (rec["NAME.1"] as string) ||
                  (rec["FULL.NAME"] as string) ||
                  (rec["TXN.CODE"] as string) ||
                  `Record #${recId}`;
                const status = (rec["RECORD.STATUS"] as string) || (rec["STATUS"] as string) || "LIVE";
                return {
                  id: recId,
                  label,
                  details: `Status: ${status} | Auth: YES`,
                };
              })
            : []
        }
        moreActions={getDefaultMoreActions(schema.code)}
      />

      {/* Screen Body */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {screenMode === "IDLE" ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Layers className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {schema.title} ({schema.code})
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Select an action from the top toolbar to begin. Use <strong>+</strong> to create a new
              entry, or enter / search a <strong>Record ID</strong> to view or edit existing records.
            </p>
          </div>
        ) : (
          <FormGrid
            schema={schema}
            values={values}
            onChange={handleFieldChange}
            errors={errors}
            disabled={submitting}
            mode={screenMode}
          />
        )}
      </div>
    </div>
  );
}
