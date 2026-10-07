"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { ModelConfigRecord, ModelConfigScreenMode, ModelProperty } from "../types";
import { modelConfigRecordSchema } from "../types";

export function renumberProperties(props: ModelProperty[], parentSN = ""): ModelProperty[] {
  return props.map((p, i) => {
    const sn = parentSN ? `${parentSN}_${i + 1}` : String(i + 1);
    return {
      ...p,
      sn,
      children: p.children && p.children.length > 0 ? renumberProperties(p.children, sn) : [],
    };
  });
}

const INITIAL_MODEL: ModelConfigRecord = {
  recordId: "",
  description: "",
  tableName: "",
  prefix: "",
  category: "",
  servicePath: "",
  userDefineId: false,
  predefineId: false,
  access: "",
  searchable: false,
  readOnly: false,
  authorize: false,
  associates: [],
  devBy: "",
  devDate: "",
  idDef: {
    idPrefix: "",
    idPattern: "",
    sequenceReset: false,
  },
  properties: [],
  isActive: false,
};

export interface ModelCatalogItem {
  id: string;
  label: string;
  details: string;
  record?: ModelConfigRecord;
}

export function useModelConfig(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<ModelConfigScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<ModelConfigRecord>(INITIAL_MODEL);
  const [modelsPool, setModelsPool] = React.useState<ModelCatalogItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // 1. Catalog can be refreshed on demand when triggered
  const refreshCatalog = React.useCallback(async () => {
    try {
      const res = await cbs.send<ModelCatalogItem[]>(cbs.modelConfig.listModelConfigs(), {
        silent: true,
      });
      if (res.status === "SUCCESS" && Array.isArray(res.data)) {
        setModelsPool(res.data);
      }
    } catch {
      // Graceful fallback for catalog listing
    }
  }, []);


  // 2. Fetch specific model record by ID via API
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
          setMode(targetMode);
          toast.add({
            title: "Model Loaded",
            description: `Loaded data dictionary for #${cleanId}`,
            type: "success",
          });
        } else {
          setFormData({ ...INITIAL_MODEL, recordId: cleanId, description: `${cleanId} Model` });
          setMode("CREATE");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load model from API";
        toast.add({
          title: "Model Fetch Failed",
          description: msg,
          type: "error",
        });
        setFormData({ ...INITIAL_MODEL, recordId: cleanId, description: `${cleanId} Model` });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 2. Create fresh model
  const handleCreateNew = React.useCallback(() => {
    const nextId = `APP.CUSTOM.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({
      ...INITIAL_MODEL,
      recordId: nextId,
      description: "",
      properties: [],
    });
    setMode("CREATE");
  }, []);

  // 3. Save model record (PUT to MODEL.CONFIG)
  const handleSubmit = React.useCallback(async () => {
    const validation = modelConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      toast.add({
        title: "Validation Error",
        description: validation.error.issues[0]?.message || "Invalid model definition",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const json = await cbs.send(
        cbs.modelConfig.saveModelConfig(
          formData.recordId,
          validation.data as Record<string, unknown>,
        ),
        {
          successTitle: "Model Saved",
          successMessage: `Saved schema #${formData.recordId} to MODEL.CONFIG`,
        },
      );
      if (json.status === "SUCCESS") {
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
  }, [formData]);

  // 4. Authorize model record
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
  }, [recordId]);

  // Field manipulation helpers
  const addField = React.useCallback(() => {
    setFormData((prev) => {
      const newField: ModelProperty = {
        sn: "",
        name: `FIELD_${prev.properties.length + 1}`,
        label: `Field ${prev.properties.length + 1}`,
        type: "Text",
        structure: "S",
        length: 50,
        required: false,
        disabled: false,
        width: 180,
        options: [],
        children: [],
      };
      return {
        ...prev,
        properties: renumberProperties([...prev.properties, newField]),
      };
    });
  }, []);

  const updateField = React.useCallback((sn: string, patch: Partial<ModelProperty>) => {
    setFormData((prev) => {
      const updateRecursive = (list: ModelProperty[]): ModelProperty[] =>
        list.map((item) => {
          if (item.sn === sn) return { ...item, ...patch };
          if (item.children.length > 0)
            return { ...item, children: updateRecursive(item.children) };
          return item;
        });
      return { ...prev, properties: updateRecursive(prev.properties) };
    });
  }, []);

  const removeField = React.useCallback((sn: string) => {
    setFormData((prev) => {
      const removeRecursive = (list: ModelProperty[]): ModelProperty[] =>
        list
          .filter((item) => item.sn !== sn)
          .map((item) => ({ ...item, children: removeRecursive(item.children) }));
      return { ...prev, properties: renumberProperties(removeRecursive(prev.properties)) };
    });
  }, []);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_MODEL);
  }, []);

  React.useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  React.useEffect(() => {
    if (initialId) {
      fetchRecord(initialId);
    }
  }, [fetchRecord, initialId]);

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
    handleSubmit,
    handleAuthorize,
    addField,
    updateField,
    removeField,
    resetToIdle,
  };
}
