import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";

export function useSidebarMenu() {
  const { data: menuItems = [], isLoading: loading } = useQuery(cbsQueries.menuTree.active());

  return {
    treeNodes: menuItems,
    loading,
  };
}
