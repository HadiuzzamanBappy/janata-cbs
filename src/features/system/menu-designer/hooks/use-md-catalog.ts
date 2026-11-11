"use client";

import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";

export function useMdCatalog() {
  const { data: catalogItems = [], isLoading: catalogLoading } = useQuery(cbsQueries.menu.list());

  return {
    catalogItems,
    catalogLoading,
  };
}
