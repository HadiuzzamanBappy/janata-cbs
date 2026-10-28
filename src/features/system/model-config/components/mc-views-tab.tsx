"use client";

import * as React from "react";
import type {
  ModelConfigRecord,
  ViewDefField,
  ViewDefItem,
} from "@/lib/data-schemas/model-config-schema";
import { McViewInspector } from "./view/mc-view-inspector";
import { McViewList } from "./view/mc-view-list";

interface McViewsTabProps {
  formData: ModelConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>;
  isReadOnly: boolean;
}

export function McViewsTab({ formData, setFormData, isReadOnly }: McViewsTabProps) {
  const views = React.useMemo(() => formData.VIEWDEF || [], [formData.VIEWDEF]);
  const [selectedIdx, setSelectedIdx] = React.useState<number>(0);

  // Keep selection valid
  React.useEffect(() => {
    if (views.length === 0) {
      setSelectedIdx(0);
    } else if (selectedIdx >= views.length) {
      setSelectedIdx(views.length - 1);
    }
  }, [views.length, selectedIdx]);

  const selectedView = views[selectedIdx];

  // Helper to update views array immutably
  const updateViews = React.useCallback(
    (updater: (prevViews: ViewDefItem[]) => ViewDefItem[]) => {
      setFormData((prev) => ({
        ...prev,
        VIEWDEF: updater(prev.VIEWDEF || []),
      }));
    },
    [setFormData],
  );

  const handleAddView = () => {
    const newView: ViewDefItem = {
      VIEWNAME: `${formData.TABLENAME || "V"}_VIEW_${views.length + 1}`.toUpperCase(),
      DESCRIPTION: "",
      FIELDS: [
        {
          TABLENAME: formData.TABLENAME || "",
          FIELDNAME: formData.PROPERTIES?.[0]?.NAME || "",
        },
      ],
    };
    updateViews((prev) => [...prev, newView]);
    setSelectedIdx(views.length);
  };

  const handleDeleteView = (indexToDelete: number) => {
    updateViews((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    if (selectedIdx >= indexToDelete && selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  const handleUpdateCurrentView = (patch: Partial<ViewDefItem>) => {
    updateViews((prev) => prev.map((v, idx) => (idx === selectedIdx ? { ...v, ...patch } : v)));
  };

  const handleAddFieldToView = () => {
    if (!selectedView) return;
    const newField: ViewDefField = {
      TABLENAME: formData.TABLENAME || "",
      FIELDNAME: "",
    };
    handleUpdateCurrentView({
      FIELDS: [...(selectedView.FIELDS || []), newField],
    });
  };

  const handleUpdateFieldInView = (fieldIdx: number, fieldPatch: Partial<ViewDefField>) => {
    if (!selectedView) return;
    const updatedFields = (selectedView.FIELDS || []).map((f, idx) =>
      idx === fieldIdx ? { ...f, ...fieldPatch } : f,
    );
    handleUpdateCurrentView({ FIELDS: updatedFields });
  };

  const handleDeleteFieldFromView = (fieldIdx: number) => {
    if (!selectedView) return;
    const updatedFields = (selectedView.FIELDS || []).filter((_, idx) => idx !== fieldIdx);
    handleUpdateCurrentView({ FIELDS: updatedFields });
  };

  return (
    <div className="h-full w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0">
      <McViewList
        views={views}
        selectedIdx={selectedIdx}
        onSelectIdx={setSelectedIdx}
        isReadOnly={isReadOnly}
        onAddView={handleAddView}
        onDeleteView={handleDeleteView}
      />
      <McViewInspector
        view={selectedView}
        viewIdx={selectedIdx}
        defaultTableName={formData.TABLENAME}
        isReadOnly={isReadOnly}
        onUpdateView={handleUpdateCurrentView}
        onAddField={handleAddFieldToView}
        onUpdateField={handleUpdateFieldInView}
        onDeleteField={handleDeleteFieldFromView}
      />
    </div>
  );
}
