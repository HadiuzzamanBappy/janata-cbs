"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import { parseMenuTreeRecord, serializeMenuTreeToWireJson } from "@/lib/data-parsers";
import {
  type MenuDesignerValidationError,
  type MenuTreeNode,
  menuTreeRecordSchema,
} from "@/lib/data-schemas/menu-designer-schema";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { mapMdZodIssues } from "./md-validation";
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
    resolvedInitialId,
    resolvedInitialMode,
    hydrate,
    rebaseline,
    reset,
    isDirty,
    dirtyKeys,
  } = useMdPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<MenuDesignerValidationError[]>([]);

  const { catalogItems, catalogLoading, availableTrees, refetchTrees } = useMdCatalog();

  const setTreeNodes = React.useCallback(
    (updater: (prev: MenuTreeNode[]) => MenuTreeNode[]) => {
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
        const json = await cbs.send<unknown>(cbs.menuTree.get(), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
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
    if (!result.success) {
      const issues = mapMdZodIssues(result.error.issues);
      setValidationErrors(issues);
      toast.add({
        title: "Validation Failed",
        description: `${issues.length} issue(s) detected in the hierarchy specification.`,
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

  const handleSubmit = React.useCallback(async () => {
    const isValid = handleValidate();
    if (!isValid) return false;

    setSubmitting(true);
    try {
      const wireData = serializeMenuTreeToWireJson(formData);
      const json = await cbs.send(
        cbs.menuTree.save(wireData as unknown as Record<string, unknown>, {
          recordId: formData.recordId || recordId,
        }),
        {
          successTitle: "Navigation Tree Committed",
          successMessage: `Saved hierarchy ${formData.recordId || recordId} to MENU.TREE`,
        },
      );

      if (json.status === "SUCCESS") {
        rebaseline();
        refetchTrees();
        setValidationErrors([]);
        reset();
        return true;
      }
      return false;
    } catch (err: unknown) {
      toast.add({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save hierarchy",
        type: "error",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formData, recordId, reset, rebaseline, refetchTrees, handleValidate]);

  const handleAuthorize = React.useCallback(async () => {
    if (!recordId.trim()) return false;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.menuTree.authorize(recordId.trim().toUpperCase()), {
        successTitle: "Navigation Tree Authorized",
        successMessage: `Authorized live menu tree #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        rebaseline();
        refetchTrees();
        reset();
        return true;
      }
      return false;
    } catch (err: unknown) {
      toast.add({
        title: "Authorization Error",
        description: err instanceof Error ? err.message : "Authorization failed",
        type: "error",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [recordId, reset, rebaseline, refetchTrees]);

  const handleCreateNew = React.useCallback(
    (customId?: string) => {
      const nextId = customId || `TREE.${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
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
    loading,
    submitting,
    isDirty,
    dirtyKeys,
    catalogItems,
    catalogLoading,
    availableTrees,
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
