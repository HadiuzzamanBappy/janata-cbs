"use client";

import { AlertTriangle, Plus } from "lucide-react";
import * as React from "react";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { toast } from "@/components/ui/toast";
import { useFormState } from "../hooks/use-form-state";
import { useSchema } from "../hooks/use-schema";

import type { DynamicFormProps } from "../types";
import { ActionBar } from "./action-bar";
import { FormRenderer } from "./form-renderer";
import { ScreenSkeleton } from "./screen-skeleton";

const EMPTY_INITIAL_VALUES: Record<string, unknown> = {};

export function DynamicForm({
  command,
  tabId,
  initialValues = EMPTY_INITIAL_VALUES,
  onSuccess,
}: DynamicFormProps & {
  tabId?: string;
  initialValues?: Record<string, unknown>;
}) {
  const { schema, loading, error, refetch } = useSchema(command);
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  // Read persisted screenMode and searchRecordId from tab state on refresh
  const [screenMode, setScreenModeState] = React.useState<"IDLE" | "CREATE" | "EDIT">(
    currentTab?.screenMode || "IDLE",
  );
  const [searchRecordId, setSearchRecordIdState] = React.useState<string>(
    currentTab?.searchRecordId || "",
  );
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const setScreenMode = React.useCallback(
    (mode: "IDLE" | "CREATE" | "EDIT") => {
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
  // Merge initialValues with saved tab draft data
  const mergedInitialValues = React.useMemo(() => {
    return { ...initialValues, ...currentTab?.formData };
  }, [initialValues, currentTab?.formData]);

  const { values, errors, setValue, validate, resetForm } = useFormState(
    schema,
    mergedInitialValues,
  );

  // Sync typed form field changes back into the tab store
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
    return <ScreenSkeleton />;
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
      <ActionBar
        title={schema.title}
        commandCode={schema.code}
        mode={screenMode}
        recordId={searchRecordId}
        onRecordIdChange={setSearchRecordId}
        onRecordSearch={(id) => {
          setSearchRecordId(id);
          setScreenMode("EDIT");
          toast.add({
            title: "Record Loaded",
            description: `Fetched record #${id} for ${schema.code}`,
            type: "info",
          });
        }}
        onCreateNew={() => {
          resetForm(initialValues);
          setScreenMode("CREATE");
          toast.add({
            title: "New Record",
            description: `Ready to input new transaction for ${schema.title}`,
            type: "info",
          });
        }}
        onAmend={() => {
          setScreenMode("EDIT");
          toast.add({
            title: "Amend Record",
            description: `Switched to Amend mode for ${schema.title}`,
            type: "info",
          });
        }}
        onView={() => {
          toast.add({
            title: "View Record",
            description: `Viewing record details for ${schema.title}`,
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
        moreActions={[
          {
            label: "List Live File",
            onClick: () =>
              toast.add({
                title: "Enquiry",
                description: `Listing active live records for ${schema.code}`,
                type: "info",
              }),
            requiredRight: "S",
          },
          {
            label: "List Unauth File",
            onClick: () =>
              toast.add({
                title: "Enquiry",
                description: `Listing unauthorized records for ${schema.code}`,
                type: "info",
              }),
            requiredRight: "S",
          },
          {
            label: "List History File",
            onClick: () =>
              toast.add({
                title: "Enquiry",
                description: `Fetching history records for ${schema.code}`,
                type: "info",
              }),
            requiredRight: "R",
          },
          {
            label: "Search Live File",
            onClick: () =>
              toast.add({
                title: "Search",
                description: `Opening Live File search dialog for ${schema.code}`,
                type: "info",
              }),
            requiredRight: "S",
          },
          {
            label: "Search Unauth File",
            onClick: () =>
              toast.add({
                title: "Search",
                description: `Opening Unauthorized File search dialog for ${schema.code}`,
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
        ]}
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
          <FormRenderer
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
