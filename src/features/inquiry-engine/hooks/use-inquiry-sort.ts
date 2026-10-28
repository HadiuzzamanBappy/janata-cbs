import * as React from "react";
import type { EnquiryRow } from "@/lib/data-schemas/inquiry-config-schema";

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function useInquirySort(rows: EnquiryRow[]) {
  const [sortState, setSortState] = React.useState<SortState>({
    column: null,
    direction: null,
  });

  const handleSort = React.useCallback((column: string) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  }, []);

  const sortedRows = React.useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return rows;
    }

    const { column, direction } = sortState;
    const factor = direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      // Numeric comparison
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * factor;
      }

      // String comparison
      return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * factor;
    });
  }, [rows, sortState]);

  return {
    sortState,
    handleSort,
    sortedRows,
  };
}

