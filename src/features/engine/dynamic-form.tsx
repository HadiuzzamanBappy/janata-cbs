"use client";

import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { FormRenderer } from "@/features/engine/form-renderer";
import { useFormState } from "@/features/engine/hooks/use-form-state";
import { useSchema } from "@/features/engine/hooks/use-schema";

export interface DynamicFormProps {
  command: string;
  initialValues?: Record<string, any>;
  onSuccess?: (response: any) => void;
}

const EMPTY_INITIAL_VALUES: Record<string, any> = {};

export function DynamicForm({
  command,
  initialValues = EMPTY_INITIAL_VALUES,
  onSuccess,
}: DynamicFormProps) {
  const { schema, loading, error, refetch } = useSchema(command);
  const { values, errors, setValue, validate, resetForm } = useFormState(
    schema,
    initialValues,
  );
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          description:
            json.message || `Record saved successfully for ${schema.title}`,
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
    } catch (err: any) {
      toast.add({
        title: "Network Error",
        description: err?.message || "Communication failed",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-12 gap-4 mt-6">
          <Skeleton className="col-span-6 h-12" />
          <Skeleton className="col-span-6 h-12" />
          <Skeleton className="col-span-6 h-12" />
          <Skeleton className="col-span-6 h-12" />
        </div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="p-8 max-w-md mx-auto my-12 flex flex-col items-center text-center gap-3 bg-muted/40 rounded-lg border border-border">
        <AlertTriangle className="size-8 text-destructive" />
        <h3 className="font-semibold text-sm">Failed to Load Command Schema</h3>
        <p className="text-xs text-muted-foreground">
          {error || `No schema found for "${command}"`}
        </p>
        <Button size="sm" variant="outline" onClick={refetch}>
          Retry Fetching Schema
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Sticky Screen Header + Toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            {schema.title}
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
              {schema.code}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Command: <code className="font-mono">{command}</code> | ID Prefix:{" "}
            <code className="font-mono">{schema.idPrefix}</code>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => resetForm(initialValues)}
            disabled={submitting}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            className="h-8 text-xs gap-1.5"
            onClick={handleSubmit}
          >
            <Save className="size-3.5" />
            {submitting ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <FormRenderer
          schema={schema}
          values={values}
          onChange={setValue}
          errors={errors}
          disabled={submitting}
        />
      </div>
    </div>
  );
}
