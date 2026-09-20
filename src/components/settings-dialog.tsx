"use client"

import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/components/ui/sidebar"
import { ShieldIcon, PaintbrushIcon, UserIcon, LogOut } from "lucide-react"
import { ChangePassword } from "@/features/settings/security-tab"
import { ProfileTab } from "@/features/settings/profile-tab"
import { AppearanceTab } from "@/features/settings/appearance-tab"
import { useSessionStore } from "@/store/session-store"

const data = {
  nav: [
    {
      name: "User Profile",
      icon: <UserIcon />,
      id: "profile"
    },
    {
      name: "Security & Password",
      icon: <ShieldIcon />,
      id: "security"
    },
    {
      name: "Appearance",
      icon: <PaintbrushIcon />,
      id: "appearance"
    },
  ],
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function SettingsDialog({ open, onOpenChange, activeTab: controlledTab, onTabChange }: SettingsDialogProps) {
  const [internalTab, setInternalTab] = React.useState("profile");

  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = onTabChange || setInternalTab;

  const { logout } = useSessionStore();

  const activeNavItem = data.nav.find(n => n.id === activeTab) || data.nav[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 w-[95vw] sm:max-w-[95vw] md:max-w-[80vw] lg:max-w-4xl h-[85vh] md:h-[75vh] max-h-[800px] flex rounded-xl">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your system settings and profile.
        </DialogDescription>
        <SidebarProvider className="items-start flex-1 min-h-0" style={{ "--sidebar-width": "14rem" } as React.CSSProperties}>
          <Sidebar className="border-r border-border/50 h-full bg-sidebar/50">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === activeTab}
                          onClick={() => setActiveTab(item.id)}
                          className="cursor-pointer"
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border/50">
              <SidebarMenuButton
                onClick={logout}
                className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarFooter>
          </Sidebar>
          <main className="flex h-full flex-1 flex-col overflow-hidden bg-surface min-w-0">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/50">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="md:hidden" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink className="cursor-default">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeNavItem.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              {activeTab === "profile" && <ProfileTab />}

              {activeTab === "security" && <ChangePassword />}

              {activeTab === "appearance" && <AppearanceTab />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
