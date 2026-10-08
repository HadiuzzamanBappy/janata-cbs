"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { CbsScreenScaffold } from "@/lib/cbs-screen";
import { useFormPersistence } from "../hooks/use-form-persistence";
import { useFormSchema } from "../hooks/use-form-schema";
import { useFormState } from "../hooks/use-form-state";
import type { DynamicFormProps } from "../types";
import { getDefaultMoreActions } from "../utils/more-actions";
import {
  findPrimaryKeyField,
  findRecordInFixtures,
  getAvailableFixtureRecords,
} from "../utils/record-finder";
import { normalizeRecordData } from "../utils/record-normalizer";
import { FormGrid } from "./form-grid";
import { FormSkeleton } from "./form-skeleton";

const EMPTY_INITIAL_VALUES: Record<string, unknown> = {};

export type FormScreenProps = DynamicFormProps & {
  initialValues?: Record<string, unknown>;
  /** Override starting screen mode — used by inline drill-down so form opens in VIEW/EDIT immediately */
  initialScreenMode?: "IDLE" | "CREATE" | "EDIT" | "VIEW";
  /** Override starting record ID — used by inline drill-down to pre-seed the record key */
  initialRecordId?: string;
  /** Optional override for the ⬆ Return action — used by inline popup drill-down to go back to the enquiry list */
  onReturn?: () => void;
};

export function FormScreen({
  command,
  tabId,
  initialValues = EMPTY_INITIAL_VALUES,
  initialScreenMode,
  initialRecordId: initialRecordIdProp,
  onSuccess,
  onReturn,
}: FormScreenProps) {
  const { schema, loading, error, refetch } = useFormSchema(command);

  const {
    currentTab,
    screenMode,
    setScreenMode,
    searchRecordId,
    setSearchRecordId,
    mergedInitialValues,
    persistFieldChange,
  } = useFormPersistence({
    tabId,
    initialScreenMode,
    initialRecordId: initialRecordIdProp,
    initialValues,
  });

  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const displayCommandCode = React.useMemo(() => {
    if (command?.includes(",")) {
      const parts = command.split(",");
      if (parts[1] && !parts[1].match(/^\d+$/) && !Number.isNaN(Number(parts[1]))) {
        return command.trim().toUpperCase();
      }
    }
    return schema?.code || command;
  }, [command, schema?.code]);

  const { values, errors, setValue, validate, resetForm, setValues } = useFormState(
    schema,
    mergedInitialValues,
  );

  // Load record from database (or mock database) when in VIEW or EDIT mode with a recordId
  const loadRecordData = React.useCallback(
    async (recordIdToLoad: string, modeToSet: "EDIT" | "VIEW") => {
      if (!schema || !recordIdToLoad.trim()) return;

      const cleanModel = schema.code.toUpperCase();
      const cleanId = recordIdToLoad.trim();
      const foundRecord = findRecordInFixtures(cleanModel, cleanId);

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

      // Live backend query via proxy
      try {
        const json = await cbs.send<Record<string, unknown>>(
          cbs.inquiry.fetchSingleRecord(schema.code, cleanId),
          { silent: true },
        );

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
        setScreenMode(modeToSet);
      }
    },
    [schema, setScreenMode, setValues],
  );

  // Auto-populate & synchronize record when schema loads or searchRecordId / formData changes
  React.useEffect(() => {
    if (!schema) return;

    const cleanModel = schema.code.toUpperCase();
    const cleanId = (searchRecordId || "").trim();
    const found = cleanId ? findRecordInFixtures(cleanModel, cleanId) : undefined;
    const rawData = found || (currentTab?.formData as Record<string, unknown>) || undefined;

    if (rawData && Object.keys(rawData).length > 0) {
      const normalized = normalizeRecordData(rawData, schema);
      if (cleanId) {
        const idField = findPrimaryKeyField(schema);
        if (idField && !normalized[idField.name]) {
          normalized[idField.name] = cleanId;
        }
      }

      setValues(normalized);

      if (screenMode === "CREATE" && found) {
        setScreenMode("EDIT");
        toast.add({
          title: "Existing Record Found",
          description: `Record #${cleanId} already exists. Loaded in Edit mode.`,
          type: "info",
        });
      }
    } else if (cleanId) {
      const idField = findPrimaryKeyField(schema);
      if (idField) {
        setValue(idField.name, cleanId);
      }
    }
  }, [
    schema,
    searchRecordId,
    currentTab?.formData,
    screenMode,
    setValues,
    setValue,
    setScreenMode,
  ]);

  const handleFieldChange = (name: string, val: unknown) => {
    setValue(name, val);
    persistFieldChange(name, val);
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
      const json = await cbs.send(cbs.form.commitRecord(schema.code, values), {
        successTitle: "Transaction Saved",
        successMessage: `Record saved successfully for ${schema.title}`,
      });

      if (json.status === "SUCCESS") {
        if (onSuccess) onSuccess(json);
      }
    } catch {
      // Toast notification is managed by cbs.send
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FormSkeleton />;

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
    <CbsScreenScaffold
      variant="form"
      title={schema.title}
      commandCode={displayCommandCode}
      mode={screenMode}
      recordId={searchRecordId}
      onRecordIdChange={setSearchRecordId}
      onRecordSearch={(query) => {
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
      availableItems={getAvailableFixtureRecords(schema.code)}
      moreActions={getDefaultMoreActions(schema.code)}
      auditData={
        screenMode !== "IDLE"
          ? {
              recordStatus: (values?.RECORD_STATUS as string) || (values?.status as string) || "LIVE",
              currNo: (values?.CURR_NO as number | string) || "1",
              inputter: (values?.INPUTTER as string) || "CBS.OFFICER",
              dateTime:
                (values?.DATE_TIME as string) ||
                new Date().toISOString().replace("T", " ").substring(0, 19),
              authoriser: (values?.AUTHORISER as string) || "CBS.AUTH",
            }
          : undefined
      }
    >
      <div className="flex-1 overflow-auto p-2">
        <FormGrid
          schema={schema}
          values={values}
          onChange={handleFieldChange}
          errors={errors}
          disabled={submitting}
          mode={screenMode}
        />
      </div>
    </CbsScreenScaffold>
  );
}
