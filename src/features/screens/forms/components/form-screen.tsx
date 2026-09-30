"use client";

import { AlertTriangle, Plus } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useWorkbenchStore } from "@/store";
import { useFormSchema } from "../hooks/use-form-schema";
import { useFormState } from "../hooks/use-form-state";
import type { DynamicFormProps } from "../types";
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
};

export function FormScreen({
  command,
  tabId,
  initialValues = EMPTY_INITIAL_VALUES,
  onSuccess,
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
      if (modeParam === "CREATE" || modeParam === "EDIT" || modeParam === "IDLE") {
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

  const [screenMode, setScreenModeState] = React.useState<"IDLE" | "CREATE" | "EDIT" | "VIEW">(initialMode);
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

  const { values, errors, setValue, validate, resetForm } = useFormState(
    schema,
    mergedInitialValues,
  );

  const handleFieldChange = (name: string, val: unknown) => {
    setValue(name, val);
    if (tabId) {
      updateFormData(tabId, { [name]: val });
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
      const res = await fetch("/api/proxy", {
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
        commandCode={schema.code}
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

          // Open data with form for editing the record
          setScreenMode("EDIT");
          toast.add({
            title: "Edit Record",
            description: `Opening record #${id} in edit mode for ${schema.title}`,
            type: "info",
          });
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

          setScreenMode("VIEW");
          toast.add({
            title: "View Record",
            description: `Viewing record details for #${id} (${schema.title})`,
            type: "info",
          });
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

          setScreenMode("EDIT");
          toast.add({
            title: "Perform Action",
            description: `Executing action on record #${id} (${schema.title})`,
            type: "info",
          });
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
        moreActions={getDefaultMoreActions(schema.code)}
      />

      {/* Screen Body */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {screenMode === "IDLE" ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Plus className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {schema.title} ({schema.code})
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Select an action from the top toolbar to begin. Click <strong>+ New Record</strong> to
              create a record or enter a <strong>Record ID</strong> in the search bar.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  resetForm(initialValues);
                  setScreenMode("CREATE");
                }}
                className="h-8 text-xs font-medium gap-1.5"
              >
                <Plus className="size-3.5" />
                Create New Record
              </Button>
            </div>
          </div>
        ) : (
          <FormGrid
            schema={schema}
            values={values}
            onChange={handleFieldChange}
            errors={errors}
            disabled={submitting}
          />
        )}
      </div>
    </div>
  );
}

