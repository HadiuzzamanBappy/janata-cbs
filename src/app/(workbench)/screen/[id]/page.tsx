"use client";

import { useParams } from "next/navigation";
import { AlertStoreProvider } from "@/components/providers/alert-provider";
import { SessionStoreProvider } from "@/components/providers/session-provider";
import { WorkbenchStoreProvider } from "@/components/providers/workbench-provider";
import { ComponentLoader } from "@/features/workspace";

export default function StandaloneScreenPage() {
  const params = useParams();
  const rawId = (params?.id as string) ?? "ACCOUNT";
  const screenId = decodeURIComponent(rawId);

  return (
    <SessionStoreProvider>
      <WorkbenchStoreProvider>
        <AlertStoreProvider>
          <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground antialiased select-none">
            {/* Screen Canvas Container (Takes 100% viewport height cleanly) */}
            <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-background">
              <ComponentLoader command={screenId} mode="window" className="flex-1 h-full min-h-0" />
            </main>
          </div>
        </AlertStoreProvider>
      </WorkbenchStoreProvider>
    </SessionStoreProvider>
  );
}
