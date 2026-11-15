import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";

export function useCbsMenu() {
  const { data: menuItems = [], isLoading: loading } = useQuery(cbsQueries.menuTree.active());

  return {
    treeNodes: menuItems,
    loading,
  };
}
