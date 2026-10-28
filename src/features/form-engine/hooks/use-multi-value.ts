import { useEffect, useMemo, useState } from "react";

export function useMultiValue(
  value: unknown,
  isMulti: boolean,
  onChange: (key: string, value: unknown) => void,
  fieldKey: string,
) {
  // Support for Multi-Value (M) primitive arrays with stable keys
  const [itemIds, setItemIds] = useState<string[]>(() => {
    const count = Array.isArray(value) ? Math.max(value.length, 1) : 1;
    return Array.from({ length: count }, () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    );
  });

  const arrayValues: unknown[] = useMemo(() => {
    if (!isMulti) return [];
    if (Array.isArray(value)) return value;
    return value !== undefined && value !== null && value !== "" ? [value] : [""];
  }, [isMulti, value]);

  useEffect(() => {
    if (!isMulti) return;
    setItemIds((prev) => {
      if (prev.length === arrayValues.length) return prev;
      if (prev.length < arrayValues.length) {
        const addedCount = arrayValues.length - prev.length;
        const newIds = Array.from({ length: addedCount }, () =>
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        );
        return [...prev, ...newIds];
      }
      return prev.slice(0, arrayValues.length);
    });
  }, [isMulti, arrayValues.length]);

  const handleArrayChange = (idx: number, newVal: unknown) => {
    const next = [...arrayValues];
    next[idx] = newVal;
    onChange(fieldKey, next);
  };

  const handleAddArrayItem = (afterIdx?: number) => {
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (afterIdx !== undefined && afterIdx >= 0) {
      const nextIds = [...itemIds];
      nextIds.splice(afterIdx + 1, 0, newId);
      setItemIds(nextIds);

      const next = [...arrayValues];
      next.splice(afterIdx + 1, 0, "");
      onChange(fieldKey, next);
    } else {
      setItemIds((prev) => [...prev, newId]);
      onChange(fieldKey, [...arrayValues, ""]);
    }
  };

  const handleRemoveArrayItem = (idx: number) => {
    setItemIds((prev) => prev.filter((_, i) => i !== idx));
    const next = arrayValues.filter((_, i) => i !== idx);
    onChange(fieldKey, next.length > 0 ? next : [""]);
  };

  return {
    itemIds,
    arrayValues,
    handleArrayChange,
    handleAddArrayItem,
    handleRemoveArrayItem,
  };
}
