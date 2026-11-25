import { todayIso } from "@/lib/core-utils";
import { SessionStoreProvider } from "@/store";
import { AuthSplitCard } from "./_components/auth-split-card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const currentDate = todayIso();

  return (
    <SessionStoreProvider>
      <div className="min-h-screen w-full bg-background text-foreground select-none">
        <AuthSplitCard currentDate={currentDate}>{children}</AuthSplitCard>
      </div>
    </SessionStoreProvider>
  );
}
