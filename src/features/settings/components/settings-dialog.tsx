"use client";

import { BanIcon, LogOut, PaintbrushIcon, ShieldIcon, UserIcon } from "lucide-react";
import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store";
import type { SettingsTabId } from "../types";
import { AppearanceTab } from "./appearance-tab";
import { DeactivateTab } from "./deactivate-tab";
import { ProfileTab } from "./profile-tab";
import { ChangePassword as SecurityTab } from "./security-tab";

const data: { nav: Array<{ name: string; icon: React.ReactNode; id: SettingsTabId }> } = {
  nav: [
    {
      name: "User Profile",
      icon: <UserIcon />,
      id: "profile",
    },
    {
      name: "Security & Password",
      icon: <ShieldIcon />,
      id: "security",
    },
    {
      name: "Appearance",
      icon: <PaintbrushIcon />,
      id: "appearance",
    },
    {
      name: "Deactivate",
      icon: <BanIcon />,
      id: "deactivate",
    },
  ],
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: SettingsTabId | string;
  onTabChange?: (tab: SettingsTabId) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  activeTab: controlledTab,
  onTabChange,
}: SettingsDialogProps) {
  const [internalTab, setInternalTab] = React.useState<SettingsTabId>("profile");

  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = onTabChange || setInternalTab;

  const { logout } = useSessionStore();

  const activeNavItem = data.nav.find((n) => n.id === activeTab) || data.nav[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 w-[92vw] sm:max-w-2xl md:max-w-3xl h-[70vh] max-h-[580px] flex rounded-xl border border-border/60 shadow-lg">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your system settings and profile.
        </DialogDescription>
        <SidebarProvider
          className="items-start flex-1 min-h-0"
          style={{ "--sidebar-width": "11.5rem" } as React.CSSProperties}
        >
          <Sidebar className="border-r border-border/50 h-full bg-muted/20 shrink-0">
            <SidebarContent className="p-1">
              <SidebarGroup className="p-1">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === activeTab}
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "cursor-pointer text-xs h-8 px-2.5 rounded-md gap-2 font-medium transition-colors",
                            item.id === activeTab
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          )}
                        >
                          <span className="[&>svg]:size-3.5 shrink-0 text-muted-foreground group-data-[active=true]/menu-button:text-primary">
                            {item.icon}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-2 border-t border-border/40">
              <SidebarMenuButton
                onClick={logout}
                className="cursor-pointer text-destructive/90 hover:bg-destructive/10 hover:text-destructive gap-2 text-xs h-8 px-2.5 rounded-md transition-colors"
              >
                <LogOut className="size-3.5" />
                <span className="font-medium">Sign Out</span>
              </SidebarMenuButton>
            </SidebarFooter>
          </Sidebar>
          <main className="flex h-full flex-1 flex-col overflow-hidden bg-background min-w-0">
            <header className="flex h-10 shrink-0 items-center justify-between gap-2 px-3.5 border-b border-border/50 bg-muted/10">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden size-7" />
                <Breadcrumb>
                  <BreadcrumbList className="text-xs">
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink className="cursor-default text-muted-foreground/70">
                        Settings
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block text-muted-foreground/40" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-foreground">
                        {activeNavItem.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto p-4 scrollbar-thin">
              {activeTab === "profile" && <ProfileTab />}

              {activeTab === "security" && <SecurityTab />}

              {activeTab === "appearance" && <AppearanceTab />}

              {activeTab === "deactivate" && <DeactivateTab />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

export const AppSettings = SettingsDialog;
