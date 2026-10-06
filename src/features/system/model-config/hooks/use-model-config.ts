"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
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
  category: "APPLICATION",
  properties: [],
  isActive: true,
};

// Demo schemas for Core Banking tables
const DEMO_MODELS: { id: string; label: string; details: string; record: ModelConfigRecord }[] = [
  {
    id: "CUSTOMER",
    label: "Customer Master Model",
    details: "Core CIF master definition",
    record: {
      recordId: "CUSTOMER",
      description: "Customer Master Data Model",
      tableName: "FBNK_CUSTOMER",
      category: "MASTER",
      isActive: true,
      properties: [
        {
          sn: "1",
          name: "MNEMONIC",
          label: "Short Mnemonic",
          type: "Text",
          structure: "S",
          length: 15,
          required: true,
          disabled: false,
          width: 160,
          options: [],
          children: [],
        },
        {
          sn: "2",
          name: "SHORT_NAME",
          label: "Customer Short Name",
          type: "Text",
          structure: "S",
          length: 35,
          required: true,
          disabled: false,
          width: 220,
          options: [],
          children: [],
        },
        {
          sn: "3",
          name: "SECTOR",
          label: "Sector Code",
          type: "Dropdown",
          structure: "S",
          length: 10,
          required: true,
          disabled: false,
          width: 180,
          options: ["1000 - Retail Individual", "2000 - Corporate", "3000 - Financial Institution"],
          children: [],
        },
        {
          sn: "4",
          name: "NATIONALITY",
          label: "Nationality",
          type: "Dropdown",
          structure: "S",
          length: 5,
          required: true,
          disabled: false,
          width: 150,
          options: ["US", "GB", "SG", "MY", "BD"],
          children: [],
        },
        {
          sn: "5",
          name: "CONTACT_NUMBERS",
          label: "Contact Numbers",
          type: "Text",
          structure: "M",
          length: 20,
          required: false,
          disabled: false,
          width: 200,
          options: [],
          children: [],
        },
      ],
    },
  },
  {
    id: "ACCOUNT",
    label: "Account Master Model",
    details: "Savings, Current & Ledger accounts",
    record: {
      recordId: "ACCOUNT",
      description: "Customer Accounts & Balances",
      tableName: "FBNK_ACCOUNT",
      category: "FINANCIAL",
      isActive: true,
      properties: [
        {
          sn: "1",
          name: "CUSTOMER_ID",
          label: "Customer CIF",
          type: "Text",
          structure: "S",
          length: 15,
          required: true,
          disabled: false,
          width: 160,
          options: [],
          children: [],
        },
        {
          sn: "2",
          name: "CATEGORY",
          label: "Product Category",
          type: "Dropdown",
          structure: "S",
          length: 6,
          required: true,
          disabled: false,
          width: 200,
          options: ["1001 - Savings Account", "1002 - Checking Account", "6001 - Fixed Deposit"],
          children: [],
        },
        {
          sn: "3",
          name: "CURRENCY",
          label: "Account Currency",
          type: "Dropdown",
          structure: "S",
          length: 3,
          required: true,
          disabled: false,
          width: 120,
          options: ["USD", "EUR", "GBP", "JPY", "SGD"],
          children: [],
        },
        {
          sn: "4",
          name: "WORKING_BALANCE",
          label: "Working Ledger Balance",
          type: "Number",
          structure: "S",
          length: 18,
          required: false,
          disabled: true,
          width: 180,
          options: [],
          children: [],
        },
      ],
    },
  },
  {
    id: "FUNDS.TRANSFER",
    label: "Funds Transfer Model",
    details: "Payment instructions & settlement",
    record: {
      recordId: "FUNDS.TRANSFER",
      description: "Payment Order & Clearing Engine",
      tableName: "FBNK_FUNDS_TRANSFER",
      category: "TRANSACTION",
      isActive: true,
      properties: [
        {
          sn: "1",
          name: "TRANSACTION_TYPE",
          label: "Payment Type",
          type: "Dropdown",
          structure: "S",
          length: 4,
          required: true,
          disabled: false,
          width: 180,
          options: ["AC - Intrabank Book Transfer", "OT - Interbank RTGS/SWIFT"],
          children: [],
        },
        {
          sn: "2",
          name: "DEBIT_ACCT_NO",
          label: "Debit Account",
          type: "Text",
          structure: "S",
          length: 16,
          required: true,
          disabled: false,
          width: 180,
          options: [],
          children: [],
        },
        {
          sn: "3",
          name: "CREDIT_ACCT_NO",
          label: "Credit Account",
          type: "Text",
          structure: "S",
          length: 16,
          required: true,
          disabled: false,
          width: 180,
          options: [],
          children: [],
        },
        {
          sn: "4",
          name: "AMOUNT",
          label: "Transfer Amount",
          type: "Number",
          structure: "S",
          length: 18,
          required: true,
          disabled: false,
          width: 180,
          options: [],
          children: [],
        },
      ],
    },
  },
];

export function useModelConfig(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<ModelConfigScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<ModelConfigRecord>(INITIAL_MODEL);
  const [modelsPool, setModelsPool] = React.useState(DEMO_MODELS);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // 1. Fetch specific model record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: ModelConfigScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      // Check locally first
      const found = modelsPool.find((m) => m.id.toUpperCase() === cleanId);
      if (found) {
        setFormData(found.record);
        setMode(targetMode);
        setLoading(false);
        toast.add({
          title: "Model Loaded",
          description: `Loaded data dictionary for #${cleanId}`,
          type: "success",
        });
        return;
      }

      try {
        const res = await fetch(appConfig.routes.api.proxy, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            servicePath: "default",
            requestType: "GET",
            controlName: "MODEL.CONFIG",
            recordFunction: "S",
            recordId: cleanId,
          }),
        });
        const json = await res.json();
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_MODEL, recordId: cleanId, description: `${cleanId} Model` });
          setMode("CREATE");
        }
      } catch {
        setFormData({ ...INITIAL_MODEL, recordId: cleanId, description: `${cleanId} Model` });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [modelsPool],
  );

  // 2. Create fresh model
  const handleCreateNew = React.useCallback(() => {
    const nextId = `APP.CUSTOM.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({
      ...INITIAL_MODEL,
      recordId: nextId,
      description: "Custom Data Model",
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
      const res = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "PUT",
          controlName: "MODEL.CONFIG",
          recordFunction: "I",
          recordId: formData.recordId,
          data: validation.data,
        }),
      });
      const json = await res.json();
      if (json.status === "SUCCESS" || res.ok) {
        toast.add({
          title: "Model Saved",
          description: `Saved schema #${formData.recordId} to MODEL.CONFIG`,
          type: "success",
        });
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
    } catch (err) {
      toast.add({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Error saving model",
        type: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 4. Authorize model record
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "AUT",
          controlName: "MODEL.CONFIG",
          recordFunction: "A",
          recordId,
        }),
      });
      toast.add({
        title: "Model Authorized",
        description: `Authorized live model #${recordId}`,
        type: "success",
      });
      setMode("VIEW");
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
