"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type {
  EnquiryColumnDef,
  EnquiryConfigRecord,
  EnquiryScreenMode,
  EnquirySelectionField,
} from "../types";
import { enquiryConfigRecordSchema } from "../types";

const INITIAL_ENQUIRY: EnquiryConfigRecord = {
  recordId: "",
  title: "",
  targetTable: "ACCOUNT",
  category: "FINANCIAL",
  pageSize: 20,
  isActive: true,
  selectionFields: [],
  columns: [],
  drillDownActions: [],
};

const DEMO_ENQUIRIES: {
  id: string;
  label: string;
  details: string;
  record: EnquiryConfigRecord;
}[] = [
  {
    id: "ACCT.BAL",
    label: "Account Realtime Balances (INQ ACCT.BAL)",
    details: "Target: ACCOUNT | Ledger & working balance inquiry",
    record: {
      recordId: "ACCT.BAL",
      title: "Realtime Account Balances & Ledger Inquiry",
      targetTable: "ACCOUNT",
      category: "FINANCIAL",
      pageSize: 25,
      isActive: true,
      selectionFields: [
        {
          fieldName: "CUSTOMER_ID",
          label: "Customer CIF",
          operator: "EQ",
          fieldType: "Text",
          defaultValue: "",
          required: false,
        },
        {
          fieldName: "CATEGORY",
          label: "Product Category",
          operator: "EQ",
          fieldType: "Dropdown",
          defaultValue: "",
          required: false,
        },
        {
          fieldName: "CURRENCY",
          label: "Currency",
          operator: "EQ",
          fieldType: "Text",
          defaultValue: "",
          required: false,
        },
      ],
      columns: [
        {
          fieldName: "recordId",
          headerLabel: "Account Number",
          width: 160,
          alignment: "left",
          sortable: true,
          format: "text",
        },
        {
          fieldName: "CUSTOMER_ID",
          headerLabel: "Customer CIF",
          width: 140,
          alignment: "left",
          sortable: true,
          format: "text",
        },
        {
          fieldName: "CATEGORY",
          headerLabel: "Category",
          width: 120,
          alignment: "left",
          sortable: true,
          format: "text",
        },
        {
          fieldName: "CURRENCY",
          headerLabel: "CCY",
          width: 80,
          alignment: "center",
          sortable: true,
          format: "badge",
        },
        {
          fieldName: "WORKING_BALANCE",
          headerLabel: "Working Balance",
          width: 180,
          alignment: "right",
          sortable: true,
          format: "currency",
        },
      ],
      drillDownActions: [
        { actionLabel: "View Account", targetCommand: "ACCOUNT S", icon: "ExternalLink" },
      ],
    },
  },
  {
    id: "CUSTOMER.LIST",
    label: "Customer Directory Inquiry (ENQ CUSTOMER.LIST)",
    details: "Target: CUSTOMER | Search CIF by name, sector, or nationality",
    record: {
      recordId: "CUSTOMER.LIST",
      title: "Core Customer Master Directory",
      targetTable: "CUSTOMER",
      category: "MASTER",
      pageSize: 20,
      isActive: true,
      selectionFields: [
        {
          fieldName: "SHORT_NAME",
          label: "Customer Name",
          operator: "LIKE",
          fieldType: "Text",
          defaultValue: "",
          required: false,
        },
        {
          fieldName: "SECTOR",
          label: "Sector Code",
          operator: "EQ",
          fieldType: "Dropdown",
          defaultValue: "",
          required: false,
        },
        {
          fieldName: "NATIONALITY",
          label: "Nationality",
          operator: "EQ",
          fieldType: "Text",
          defaultValue: "",
          required: false,
        },
      ],
      columns: [
        {
          fieldName: "recordId",
          headerLabel: "CIF ID",
          width: 140,
          alignment: "left",
          sortable: true,
          format: "text",
        },
        {
          fieldName: "SHORT_NAME",
          headerLabel: "Customer Name",
          width: 240,
          alignment: "left",
          sortable: true,
          format: "text",
        },
        {
          fieldName: "SECTOR",
          headerLabel: "Sector",
          width: 120,
          alignment: "left",
          sortable: true,
          format: "text",
        },
        {
          fieldName: "NATIONALITY",
          headerLabel: "Nationality",
          width: 100,
          alignment: "center",
          sortable: true,
          format: "badge",
        },
      ],
      drillDownActions: [
        { actionLabel: "Open CIF", targetCommand: "CUSTOMER S", icon: "ExternalLink" },
      ],
    },
  },
];

export function useInquiryDesigner(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<EnquiryScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<EnquiryConfigRecord>(INITIAL_ENQUIRY);
  const [enquiriesPool, setEnquiriesPool] = React.useState(DEMO_ENQUIRIES);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // 1. Fetch record
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: EnquiryScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      const found = enquiriesPool.find((e) => e.id.toUpperCase() === cleanId);
      if (found) {
        setFormData(found.record);
        setMode(targetMode);
        setLoading(false);
        toast.add({
          title: "Enquiry Loaded",
          description: `Loaded enquiry #${cleanId}`,
          type: "success",
        });
        return;
      }

      try {
        const json = await cbs.send<EnquiryConfigRecord>(cbs.inquiry.getInquiryConfig(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_ENQUIRY, recordId: cleanId, title: `${cleanId} Inquiry` });
          setMode("CREATE");
        }
      } catch {
        setFormData({ ...INITIAL_ENQUIRY, recordId: cleanId, title: `${cleanId} Inquiry` });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [enquiriesPool],
  );

  // 2. Create new enquiry
  const handleCreateNew = React.useCallback(() => {
    const nextId = `ENQ.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({
      ...INITIAL_ENQUIRY,
      recordId: nextId,
      title: "New Grid Enquiry",
    });
    setMode("CREATE");
  }, []);

  // 3. Save enquiry (PUT)
  const handleSubmit = React.useCallback(async () => {
    const validation = enquiryConfigRecordSchema.safeParse(formData);
    if (!validation.success) {
      toast.add({
        title: "Validation Error",
        description: validation.error.issues[0]?.message || "Invalid enquiry definition",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const json = await cbs.send(
        cbs.inquiry.saveInquiryConfig(
          formData.recordId,
          validation.data as Record<string, unknown>,
        ),
        {
          successTitle: "Enquiry Saved",
          successMessage: `Saved enquiry configuration #${formData.recordId}`,
        },
      );
      if (json.status === "SUCCESS") {
        setEnquiriesPool((prev) => {
          const item = {
            id: validation.data.recordId,
            label: `${validation.data.title} (INQ ${validation.data.recordId})`,
            details: `Target: ${validation.data.targetTable} | ${validation.data.columns.length} cols`,
            record: validation.data,
          };
          const exists = prev.some((p) => p.id === item.id);
          return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
        });
        setMode("EDIT");
      }
    } catch {
      // Handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 4. Authorize enquiry
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.inquiry.authorizeInquiryConfig(recordId), {
        successTitle: "Enquiry Authorized",
        successMessage: `Authorized live enquiry #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        setMode("VIEW");
      }
    } catch {
      // Handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId]);

  // Mutation helpers for Filter Criteria & Display Columns
  const addFilter = React.useCallback(() => {
    setFormData((prev) => {
      const newFilter: EnquirySelectionField = {
        id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fieldName: `FILTER_${prev.selectionFields.length + 1}`,
        label: `Filter ${prev.selectionFields.length + 1}`,
        operator: "EQ",
        fieldType: "Text",
        defaultValue: "",
        required: false,
      };
      return { ...prev, selectionFields: [...prev.selectionFields, newFilter] };
    });
  }, []);

  const updateFilter = React.useCallback((index: number, patch: Partial<EnquirySelectionField>) => {
    setFormData((prev) => {
      const updated = [...prev.selectionFields];
      if (updated[index]) updated[index] = { ...updated[index], ...patch };
      return { ...prev, selectionFields: updated };
    });
  }, []);

  const removeFilter = React.useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      selectionFields: prev.selectionFields.filter((_, i) => i !== index),
    }));
  }, []);

  const addColumn = React.useCallback(() => {
    setFormData((prev) => {
      const newCol: EnquiryColumnDef = {
        id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fieldName: `COLUMN_${prev.columns.length + 1}`,
        headerLabel: `Column ${prev.columns.length + 1}`,
        width: 160,
        alignment: "left",
        sortable: true,
        format: "text",
      };
      return { ...prev, columns: [...prev.columns, newCol] };
    });
  }, []);

  const updateColumn = React.useCallback((index: number, patch: Partial<EnquiryColumnDef>) => {
    setFormData((prev) => {
      const updated = [...prev.columns];
      if (updated[index]) updated[index] = { ...updated[index], ...patch };
      return { ...prev, columns: updated };
    });
  }, []);

  const removeColumn = React.useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index),
    }));
  }, []);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_ENQUIRY);
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
    enquiriesPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    addFilter,
    updateFilter,
    removeFilter,
    addColumn,
    updateColumn,
    removeColumn,
    resetToIdle,
  };
}
