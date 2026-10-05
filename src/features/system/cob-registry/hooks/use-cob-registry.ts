"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import type { CobRegistryRecord, CobScreenMode, CobStageRegistry } from "../types";
import { cobRegistryRecordSchema } from "../types";

export const DEFAULT_COB_STAGES: CobStageRegistry[] = [
  {
    cobStage: "STAGE1",
    description: "Pre-Checking & System Snapshot",
    serviceName: ["CHECK.SYSTEM.STATUS", "VALIDATE.ACCOUNT.POSTINGS", "SNAPSHOT.GENERAL.LEDGER"],
  },
  {
    cobStage: "STAGE2",
    description: "Daily Initialization & Cash Cutoff",
    serviceName: ["BRANCH.TELLER.CUTOFF", "VERIFY.VAULT.BALANCES", "INIT.BATCH.QUEUES"],
  },
  {
    cobStage: "STAGE3",
    description: "Core Business & Interest Accrual",
    serviceName: ["ACCRUE.SAVINGS.INTEREST", "POST.LOAN.AMORTIZATION", "CHARGE.MONTHLY.FEES"],
  },
  {
    cobStage: "STAGE4",
    description: "Balancing & General Ledger Reconciliation",
    serviceName: ["RUN.TRIAL.BALANCE", "RECONCILE.CLEARING.ACCOUNTS", "BALANCE.CURRENCY.POSITIONS"],
  },
  {
    cobStage: "STAGE5",
    description: "Regulatory Reporting & Rolling Bank Date",
    serviceName: [
      "GENERATE.CENTRAL.BANK.REPORT",
      "ARCHIVE.DAY.TRANSACTIONS",
      "ROLL.BANK.SYSTEM.DATE",
    ],
  },
];

const INITIAL_COB_RECORD: CobRegistryRecord = {
  recordId: "SYSTEM",
  description: "Core Banking End-of-Day Pipeline",
  isActive: true,
  registries: DEFAULT_COB_STAGES,
};

const DEMO_COB_CONFIGS: {
  id: string;
  label: string;
  details: string;
  record: CobRegistryRecord;
}[] = [
  {
    id: "SYSTEM",
    label: "Core Enterprise EOD Pipeline",
    details: "All 5 standard stages (Cutoff, Interest, Trial Balance, Rollover)",
    record: INITIAL_COB_RECORD,
  },
  {
    id: "MONTH.END",
    label: "Month-End Capitalization Pipeline",
    details: "Includes tax withholding and interest capitalization batches",
    record: {
      recordId: "MONTH.END",
      description: "Monthly Interest Capitalization & Tax Pipeline",
      isActive: true,
      registries: [
        {
          cobStage: "STAGE1",
          description: "Pre-Capitalization Audit",
          serviceName: ["AUDIT.UNPOSTED.ENTRIES", "VERIFY.TAX.RATES"],
        },
        {
          cobStage: "STAGE2",
          description: "Interest Capitalization",
          serviceName: ["CAPITALIZE.SAVINGS.INTEREST", "DEDUCT.SOURCE.TAX"],
        },
        {
          cobStage: "STAGE3",
          description: "Monthly Financial Statements",
          serviceName: ["GENERATE.PROFIT.LOSS", "GENERATE.BALANCE.SHEET"],
        },
      ],
    },
  },
];

export function useCobRegistry(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<CobScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<CobRegistryRecord>(INITIAL_COB_RECORD);
  const [configsPool, setConfigsPool] = React.useState(DEMO_COB_CONFIGS);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // 1. Fetch record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: CobScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      const found = configsPool.find((c) => c.id.toUpperCase() === cleanId);
      if (found) {
        setFormData(found.record);
        setMode(targetMode);
        setLoading(false);
        toast.add({
          title: "COB Pipeline Loaded",
          description: `Loaded pipeline #${cleanId}`,
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
            controlName: "COB.REGISTRY",
            recordFunction: "S",
            recordId: cleanId,
          }),
        });
        const json = await res.json();
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_COB_RECORD, recordId: cleanId });
          setMode("CREATE");
        }
      } catch {
        setFormData({ ...INITIAL_COB_RECORD, recordId: cleanId });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [configsPool],
  );

  // 2. Create new record
  const handleCreateNew = React.useCallback(() => {
    const nextId = `COB.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({
      recordId: nextId,
      description: "Custom COB Pipeline",
      isActive: true,
      registries: DEFAULT_COB_STAGES,
    });
    setMode("CREATE");
  }, []);

  // 3. Save record (PUT)
  const handleSubmit = React.useCallback(async () => {
    const validation = cobRegistryRecordSchema.safeParse(formData);
    if (!validation.success) {
      toast.add({
        title: "Validation Error",
        description: validation.error.issues[0]?.message || "Invalid COB registry record",
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
          controlName: "COB.REGISTRY",
          recordFunction: "I",
          recordId: formData.recordId,
          data: validation.data,
        }),
      });
      const json = await res.json();
      if (json.status === "SUCCESS" || res.ok) {
        toast.add({
          title: "COB Pipeline Saved",
          description: `Saved batch configuration #${formData.recordId}`,
          type: "success",
        });
        setConfigsPool((prev) => {
          const item = {
            id: validation.data.recordId,
            label: validation.data.description,
            details: `${validation.data.registries.length} stages`,
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
        description: err instanceof Error ? err.message : "Error saving pipeline",
        type: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 4. Authorize record
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
          controlName: "COB.REGISTRY",
          recordFunction: "A",
          recordId,
        }),
      });
      toast.add({
        title: "COB Pipeline Authorized",
        description: `Authorized live COB batch sequence #${recordId}`,
        type: "success",
      });
      setMode("VIEW");
    } finally {
      setSubmitting(false);
    }
  }, [recordId]);

  // Stage & Service item mutations
  const addService = React.useCallback((stageIdx: number) => {
    setFormData((prev) => {
      const updated = [...prev.registries];
      const stage = updated[stageIdx];
      if (stage) {
        updated[stageIdx] = {
          ...stage,
          serviceName: [...stage.serviceName, `JOB.SERVICE_${stage.serviceName.length + 1}`],
        };
      }
      return { ...prev, registries: updated };
    });
  }, []);

  const updateService = React.useCallback((stageIdx: number, serviceIdx: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.registries];
      const stage = updated[stageIdx];
      if (stage) {
        const services = [...stage.serviceName];
        services[serviceIdx] = val.toUpperCase().replace(/\s+/g, ".");
        updated[stageIdx] = { ...stage, serviceName: services };
      }
      return { ...prev, registries: updated };
    });
  }, []);

  const removeService = React.useCallback((stageIdx: number, serviceIdx: number) => {
    setFormData((prev) => {
      const updated = [...prev.registries];
      const stage = updated[stageIdx];
      if (stage) {
        updated[stageIdx] = {
          ...stage,
          serviceName: stage.serviceName.filter((_, idx) => idx !== serviceIdx),
        };
      }
      return { ...prev, registries: updated };
    });
  }, []);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_COB_RECORD);
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
    configsPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    addService,
    updateService,
    removeService,
    resetToIdle,
  };
}
