import { ThemeToggle } from "@/components/layout";
import { SessionStoreProvider } from "@/store";
import { AuthSplitCard } from "./_components/auth-split-card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const currentDate = new Date().toISOString().split("T")[0];

  return (
    <SessionStoreProvider>
      <div className="relative min-h-screen w-full flex items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-12 overflow-hidden select-none">
        {/* Absolute Positioned Theme Toggle at Page Level */}
        <div className="absolute top-4 right-4 z-30">
          <ThemeToggle />
        </div>

        {/* Textured Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[32px_32px] opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0,transparent_100%)] opacity-10 pointer-events-none" />

        {/* Background Decorative Mesh Shapes */}
        <div className="absolute top-1/4 -left-20 size-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 size-80 rounded-full bg-primary/25 blur-3xl pointer-events-none" />

        {/* Floating Modern Split Card Container */}
        <AuthSplitCard currentDate={currentDate}>{children}</AuthSplitCard>
      </div>
    </SessionStoreProvider>
  );
}
