"use client";

import * as React from "react";
import Image from "next/image";
import logo from "@/app/icon.png";
import { useWorkbenchStore } from "@/store/workbench-store";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { launchScreen } from "@/lib/screen-launcher";

export interface TreeNode {
  id: string;
  title: string;
  command?: string;
  componentName?: string;
  children?: TreeNode[];
}

export const NAVIGATION_TREE: TreeNode[] = [
  {
    id: "operational",
    title: "Operational",
    children: [
      {
        id: "user.mgmt",
        title: "User Management",
        children: [
          {
            id: "user.request.folder",
            title: "User Request",
            children: [
              {
                id: "user.request",
                title: "User Request",
                command: "user.request",
                componentName: "USER_REQUEST",
              },
              {
                id: "user.request.create",
                title: "Create User Request",
                command: "user.request.create",
                componentName: "USER_REQUEST_CREATE",
              },
              {
                id: "user.request.unauth",
                title: "Unauthorized User Req...",
                command: "user.request.unauth",
                componentName: "USER_REQUEST_UNAUTH",
              },
            ],
          },
        ],
      },
      {
        id: "customer.manage",
        title: "Customer Manage",
        children: [
          {
            id: "customer.create",
            title: "Create Customer",
            command: "customer.create",
            componentName: "CUSTOMER_CREATE",
          },
        ],
      },
      {
        id: "account.manage",
        title: "Account Manage",
        children: [
          {
            id: "account.create",
            title: "Create Account",
            command: "account.create",
            componentName: "ACCOUNT_CREATE",
          },
        ],
      },
      {
        id: "funds.manage",
        title: "Funds Manage",
        children: [
          {
            id: "funds.transfer",
            title: "Funds Transfer",
            command: "funds.transfer",
            componentName: "FUNDS_TRANSFER",
          },
        ],
      },
      {
        id: "daily.inquiry",
        title: "Daily Inquiry",
        children: [
          {
            id: "today.txn.report",
            title: "Today Txn Report",
            command: "today.txn.report",
            componentName: "TODAY_TXN_REPORT",
          },
        ],
      },
    ],
  },
  {
    id: "inquiries.reports",
    title: "Inquiries & Reports",
    children: [
      {
        id: "general.inquiry",
        title: "General Inquiry (GIR)",
        command: "gir",
        componentName: "GIR",
      },
      {
        id: "specific.inquiry",
        title: "Specific Inquiry (SIR)",
        command: "sir",
        componentName: "SIR",
      },
      {
        id: "report.viewer",
        title: "Report Viewer",
        command: "sc.rpt",
        componentName: "REPORT_VIEWER",
      },
    ],
  },
  {
    id: "sys.config",
    title: "System Configuration",
    children: [
      {
        id: "model.config",
        title: "Model Configuration",
        command: "model.config",
        componentName: "MODEL_CONFIG",
      },
      {
        id: "form.builder",
        title: "Form Builder",
        command: "form.builder",
        componentName: "FORM_BUILDER",
      },
      {
        id: "cob.registry",
        title: "COB Registry",
        command: "cob.registry",
        componentName: "COB_REGISTRY",
      },
    ],
  },
  {
    id: "auth.admin",
    title: "Auth & Administration",
    children: [
      {
        id: "user.groups",
        title: "User Groups",
        command: "user.groups",
        componentName: "USER_GROUPS",
      },
      {
        id: "change.pass",
        title: "Change Password",
        command: "change.pass",
        componentName: "CHANGE_PASSWORD",
      },
      {
        id: "pass.reset",
        title: "Reset Password",
        command: "pass.reset",
        componentName: "RESET_PASSWORD",
      },
    ],
  },
];

interface TreeItemProps {
  node: TreeNode;
  level?: number;
}

function RecursiveTreeItem({ node }: TreeItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { addTab, tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isLeaf = !hasChildren;
  const isActive =
    isLeaf && (activeTab?.screenId === (node.command ?? node.id) || activeTab?.id === (node.command ?? node.id));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    } else {
      launchScreen({
        id: node.command ?? node.id,
        title: node.title,
        componentName: node.componentName,
        addTab,
      });
    }
  };

  return (
    <div className="flex flex-col select-none">
      {/* Node Row Header */}
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150 group",
          isActive
            ? "bg-primary/15 text-primary font-semibold"
            : "text-foreground/90 hover:bg-accent/60 hover:text-foreground"
        )}
      >
        {/* Arrow-based indicators matching tree UI specification */}
        {hasChildren ? (
          <span className="size-4 flex items-center justify-center text-muted-foreground/80 group-hover:text-foreground transition-colors shrink-0 text-[10px]">
            {isOpen ? "▼" : "▶"}
          </span>
        ) : (
          <span className="size-4 flex items-center justify-center text-muted-foreground/60 shrink-0 text-[10px] font-mono">
            ▸
          </span>
        )}

        <span className="truncate">{node.title}</span>
      </div>

      {/* Recursive Children Sub-Tree with Guide Lines */}
      {hasChildren && isOpen && (
        <div className="flex flex-col border-l border-border/50 ml-3.5 pl-2 py-0.5 space-y-0.5">
          {node.children!.map((child) => (
            <RecursiveTreeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/60" {...props}>
      {/* Sidebar Header: Brand Info matching TopBar height */}
      <SidebarHeader className="h-16 shrink-0 border-b border-border/60 px-4 py-0 flex flex-row items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={logo}
            alt="Janata Bank PLC"
            className="size-8 rounded-lg object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm leading-tight truncate text-foreground">
              Janata Bank PLc.
            </span>
            <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              Core Banking Solution
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content: Arrow-based Recursive Tree Menu */}
      <SidebarContent className="p-3 overflow-y-auto">
        <div className="flex flex-col space-y-1">
          {NAVIGATION_TREE.map((node) => (
            <RecursiveTreeItem key={node.id} node={node} />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
