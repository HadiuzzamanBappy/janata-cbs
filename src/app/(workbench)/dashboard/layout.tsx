import type * as React from "react";
import { WorkbenchShell } from "@/components/layout/workbench-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkbenchShell>{children}</WorkbenchShell>;
}
