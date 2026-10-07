"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { serializeModelToWireJson } from "@/lib/parsers";
import {
  type ModelConfigRecord,
  type ModelConfigScreenMode,
  type ModelProperty,
  modelConfigRecordSchema,
  type ValidationErrorItem,
} from "@/lib/schemas/model-config-schema";
import { mapZodIssuesToValidationErrors } from "./model-config-validation";
import {
  INITIAL_MODEL,
  useModelConfigPersistence,
} from "./use-model-config-persistence";

export interface ModelCatalogItem {
  id: string;
  label: string;
  details: string;
  record?: ModelConfigRecord;
}

export function useModelConfig(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    resolvedInitialId,
    resolvedInitialMode,
  } = useModelConfigPersistence(initialId, tabId);

  const [modelsPool, setModelsPool] = React.useState<ModelCatalogItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrorItem[]>([]);
  const [committedSnSet, setCommittedSnSet] = React.useState<Set<string>>(new Set());

  const markAsCommitted = React.useCallback((props: ModelProperty[]) => {
    setCommittedSnSet(new Set(props.map((p) => p.sn)));
  }, []);

  // 1. Fetch catalog
  const refreshCatalog = React.useCallback(async () => {
    try {
      const res = await cbs.send<ModelCatalogItem[]>(cbs.modelConfig.listModelConfigs(), {
        silent: true,
      });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        setModelsPool(res.data);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // 2. Fetch specific record
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: ModelConfigScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      try {
        const json = await cbs.send<ModelConfigRecord>(cbs.modelConfig.getModelConfig(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          markAsCommitted(json.data.properties || []);
          setMode(targetMode);
          toast.add({
            title: "Model Loaded",
            description: `Loaded data dictionary for #${cleanId}`,
            type: "success",
          });
        } else {
          setFormData({ ...INITIAL_MODEL, recordId: cleanId, description: "" });
          setCommittedSnSet(new Set());
          setMode("CREATE");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load model from API";
        toast.add({
          title: "Model Fetch Failed",
          description: msg,
          type: "error",
        });
        setFormData({ ...INITIAL_MODEL, recordId: cleanId, description: "" });
        setCommittedSnSet(new Set());
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [markAsCommitted, setFormData, setMode, setRecordId],
  );

  // 3. Create fresh record
  const handleCreateNew = React.useCallback(() => {
    const nextId = `APP.CUSTOM.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setCommittedSnSet(new Set());
    setFormData({
      ...INITIAL_MODEL,
      recordId: nextId,
      description: "",
      properties: [],
    });
    setMode("CREATE");
  }, [setFormData, setMode, setRecordId]);

  // 4. Validate
  const handleValidate = React.useCallback((): boolean => {
    const validation = modelConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errors = mapZodIssuesToValidationErrors(validation.error.issues, formData.properties);
      setValidationErrors(errors);
      toast.add({
        title: "Validation Issues Found",
        description: `${errors.length} issue${errors.length > 1 ? "s" : ""} require your attention.`,
        type: "warning",
      });
      return false;
    }
    setValidationErrors([]);
    toast.add({
      title: "Validation Successful",
      description: "All dictionary constraints and required fields verified (✓).",
      type: "success",
    });
    return true;
  }, [formData]);

  // 5. Submit
  const handleSubmit = React.useCallback(async () => {
    const validation = modelConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errors = mapZodIssuesToValidationErrors(validation.error.issues, formData.properties);
      setValidationErrors(errors);
      toast.add({
        title: "Validation Issues Found",
        description: `${errors.length} issue${errors.length > 1 ? "s" : ""} require your attention before saving.`,
        type: "warning",
      });
      return;
    }

    setValidationErrors([]);
    setSubmitting(true);
    try {
      const wireData = serializeModelToWireJson(validation.data);
      const json = await cbs.send(
        cbs.modelConfig.saveModelConfig(
          formData.recordId,
          wireData as unknown as Record<string, unknown>,
        ),
        {
          successTitle: "Model Saved",
          successMessage: `Saved schema #${formData.recordId} to MODEL.CONFIG`,
        },
      );
      if (json.status === "SUCCESS") {
        markAsCommitted(validation.data.properties || []);
        setModelsPool((prev) => {
          const item = {
            id: validation.data.recordId,
            label: validation.data.description,
            details: `${validation.data.properties.length} fields`,
            record: validation.data,
          };
          const exists = prev.some((p) => p.id === item.id);
          return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
        });
        setMode("EDIT");
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData, markAsCommitted, setMode]);

  // 6. Authorize
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.modelConfig.authorizeModelConfig(recordId), {
        successTitle: "Model Authorized",
        successMessage: `Authorized live model #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        setMode("VIEW");
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId, setMode]);

  // 7. Property mutations
  const addField = React.useCallback((): string => {
    let createdSn = "";
    setFormData((prev) => {
      const maxSn = prev.properties.reduce((max, p) => {
        const num = Number.parseInt(p.sn, 10);
        return !Number.isNaN(num) && num > max ? num : max;
      }, 0);
      const nextSn = String(maxSn + 1);
      createdSn = nextSn;
      const newField: ModelProperty = {
        sn: nextSn,
        name: "",
        label: "",
        type: "Text",
        structure: "S",
        length: 50,
        required: false,
        disabled: false,
        status: "ACTIVE",
      };
      return {
        ...prev,
        properties: [...prev.properties, newField],
      };
    });
    return createdSn;
  }, [setFormData]);

  const updateField = React.useCallback(
    (sn: string, patch: Partial<ModelProperty>) => {
      setFormData((prev) => ({
        ...prev,
        properties: prev.properties.map((p) => (p.sn === sn ? { ...p, ...patch } : p)),
      }));
    },
    [setFormData],
  );

  const isFieldCommitted = React.useCallback(
    (sn: string) => committedSnSet.has(sn),
    [committedSnSet],
  );

  const deprecateOrRemoveField = React.useCallback(
    (sn: string, forceHardDelete = false) => {
      setFormData((prev) => {
        const isCommitted = committedSnSet.has(sn);
        if (!isCommitted || forceHardDelete) {
          return {
            ...prev,
            properties: prev.properties.filter((p) => p.sn !== sn),
          };
        }
        return {
          ...prev,
          properties: prev.properties.map((p) =>
            p.sn === sn
              ? {
                  ...p,
                  status: p.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED",
                  disabled: p.status !== "ARCHIVED",
                }
              : p,
          ),
        };
      });
    },
    [committedSnSet, setFormData],
  );

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_MODEL);
  }, [setFormData, setMode, setRecordId]);

  React.useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  React.useEffect(() => {
    if (resolvedInitialId) {
      fetchRecord(resolvedInitialId, resolvedInitialMode);
    }
  }, [fetchRecord, resolvedInitialId, resolvedInitialMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    modelsPool,
    refreshCatalog,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
    addField,
    updateField,
    removeField: deprecateOrRemoveField,
    deprecateOrRemoveField,
    isFieldCommitted,
    resetToIdle,
  };
}
