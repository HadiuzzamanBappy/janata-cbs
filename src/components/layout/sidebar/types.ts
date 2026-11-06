import type { MenuAction, MenuType } from "@/lib/data-schemas";

export interface TreeNode {
  id: string;
  title: string;
  command?: string;
  componentName?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
  children?: TreeNode[];
}
