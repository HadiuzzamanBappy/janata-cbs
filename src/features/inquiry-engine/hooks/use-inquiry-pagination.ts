import * as React from "react";
import type { EnquiryRow } from "@/lib/data-schemas/inquiry-config-schema";

export interface UseInquiryPaginationProps {
  rows: EnquiryRow[];
  initialPageSize?: number;
  controlledPage?: number;
  controlledPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  totalRows?: number;
}

export function useInquiryPagination({
  rows,
  initialPageSize = 30,
  controlledPage,
  controlledPageSize,
  onPageChange,
  onPageSizeChange,
  totalRows,
}: UseInquiryPaginationProps) {
  const [internalPage, setInternalPage] = React.useState<number>(1);
  const [internalPageSize, setInternalPageSize] = React.useState<number>(initialPageSize);

  const currentPage = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? internalPageSize;

  const total = totalRows ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  const handlePageChange = React.useCallback(
    (page: number) => {
      const validPage = Math.min(Math.max(1, page), totalPages);
      if (onPageChange) {
        onPageChange(validPage);
      } else {
        setInternalPage(validPage);
      }
    },
    [totalPages, onPageChange],
  );

  const handlePageSizeChange = React.useCallback(
    (newSize: number) => {
      if (onPageSizeChange) {
        onPageSizeChange(newSize);
      } else {
        setInternalPageSize(newSize);
        setInternalPage(1);
      }
    },
    [onPageSizeChange],
  );

  const paginatedRows = React.useMemo(() => {
    // If totalRows is provided, assume server-side pagination
    if (totalRows !== undefined) {
      return rows;
    }
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize, totalRows]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalCount: total,
    handlePageChange,
    handlePageSizeChange,
    paginatedRows,
  };
}
