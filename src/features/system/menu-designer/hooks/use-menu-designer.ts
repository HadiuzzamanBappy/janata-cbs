"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { generateIdempotencyKey } from "@/lib/core-utils";
import { parseMenuTreeRecord } from "@/lib/data-parsers";
import {
  type MenuDesignerValidationError,
  type MenuItem,
  menuTreeRecordSchema,
} from "@/lib/data-schemas/menu-designer-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { mapMdZodIssues, validateMenuTreeDomain } from "./md-validation";
import { useMdActions } from "./use-md-actions";
import { useMdCatalog } from "./use-md-catalog";
import { INITIAL_MENU_TREE, useMdPersistence } from "./use-md-persistence";
import { useMdTreeOps } from "./use-md-tree-ops";

export function useMenuDesigner(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    baseline,
    resolvedInitialId,
    resolvedInitialMode,
    hydrate,
    rebaseline,
    reset,
    isDirty,
    dirtyKeys,
  } = useMdPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState(false);
  const [rawRecord, setRawRecord] = React.useState<unknown>(undefined);
  const [validationErrors, setValidationErrors] = React.useState<MenuDesignerValidationError[]>([]);

  const { catalogItems, catalogLoading } = useMdCatalog();

  const setTreeNodes = React.useCallback(
    (updater: (prev: MenuItem[]) => MenuItem[]) => {
      setFormData((prev) => ({
        ...prev,
        menuTree: updater(prev.menuTree),
      }));
    },
    [setFormData],
  );

  const treeOps = useMdTreeOps(formData.menuTree, setTreeNodes);

  const fetchTreeRecord = React.useCallback(
    async (idToFetch: string, targetMode: CbsScreenMode = CbsRecordFunction.SEE) => {
      if (!idToFetch) return;
      setLoading(true);
      try {
        const json = await cbs.send<unknown>(cbs.menuTree.get(idToFetch), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          setRawRecord(json.data);
          const res = parseMenuTreeRecord(json.data);
          if (res.success) {
            hydrate(res.data);
            setRecordId(idToFetch);
            setMode(targetMode);
            setValidationErrors([]);
            return;
          }
        }
        toast.add({
          title: "Record Not Found",
          description: `Tree ${idToFetch} could not be loaded.`,
          type: "error",
        });
      } catch (err: unknown) {
        toast.add({
          title: "Network Error",
          description: err instanceof Error ? err.message : "Failed to load menu tree",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [hydrate, setRecordId, setMode],
  );

  React.useEffect(() => {
    if (resolvedInitialId) {
      fetchTreeRecord(resolvedInitialId, resolvedInitialMode || CbsRecordFunction.SEE);
    }
  }, [resolvedInitialId, resolvedInitialMode, fetchTreeRecord]);

  const handleValidate = React.useCallback((): boolean => {
    const result = menuTreeRecordSchema.safeParse(formData);
    const zodIssues = !result.success ? mapMdZodIssues(result.error.issues) : [];
    const domainIssues = validateMenuTreeDomain(formData.menuTree || []);
    const allIssues = [...zodIssues, ...domainIssues];

    if (allIssues.length > 0) {
      setValidationErrors(allIssues);
      toast.add({
        title: "Validation Failed",
        description: `${allIssues.length} issue(s) detected in the hierarchy specification.`,
        type: "warning",
      });
      return false;
    }
    setValidationErrors([]);
    toast.add({
      title: "Hierarchy Validated",
      description: "Structure, labels, and command bindings verified clean.",
      type: "success",
    });
    return true;
  }, [formData]);

  const { submitting, handleSubmit, handleAuthorize } = useMdActions({
    formData,
    recordId,
    handleValidate,
    rebaseline,
    setValidationErrors,
    reset,
  });

  const handleCreateNew = React.useCallback(
    (customId?: string) => {
      const nextId = customId || `TREE.${generateIdempotencyKey().slice(0, 6).toUpperCase()}`;
      setRecordId(nextId);
      setValidationErrors([]);
      hydrate({
        ...INITIAL_MENU_TREE,
        recordId: nextId,
        treeDescription: `Custom Navigation (${nextId})`,
      });
      setMode(CbsRecordFunction.INPUT);
    },
    [hydrate, setRecordId, setMode],
  );

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    baseline,
    rawRecord,
    loading,
    submitting,
    isDirty,
    dirtyKeys,
    catalogItems,
    catalogLoading,
    treeOps,
    fetchTreeRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    validationErrors,
    resetToIdle: reset,
  };
}
