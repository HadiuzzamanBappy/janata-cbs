import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            F
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight">FinXUI Modern</h1>
            <p className="text-xs text-muted-foreground">Core Banking Workbench Refactor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">Documentation</Button>
          <Button variant="outline" size="sm">Architecture</Button>
          <Button variant="default" size="sm" className="gap-2">
            Get Started <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
            <Sparkles className="size-3.5" /> Next.js 16 + Tailwind v4 + shadcn/ui
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Modernized Enterprise Base Setup
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A clean, high-performance modular template for refactoring the FinXUI Core Banking application. Built with pnpm, Tailwind CSS v4, and Radix primitives.
          </p>
        </section>

        {/* Component Showcase Card */}
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Terminal className="size-5 text-primary" /> Base Setup Component Demo: Button
              </h3>
              <p className="text-sm text-muted-foreground">
                shadcn/ui Button implementation powered by Tailwind v4 OKLCH color system.
              </p>
            </div>
            <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-md text-muted-foreground">
              @/components/ui/button
            </span>
          </div>

          {/* Variants Showcase */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-medium text-muted-foreground">Variants</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Sizes Showcase */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-medium text-muted-foreground">Sizes & Icons</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs" variant="outline">Extra Small</Button>
              <Button size="sm" variant="outline">Small</Button>
              <Button size="default" variant="outline">Default</Button>
              <Button size="lg" variant="outline">Large</Button>
              <Button size="default" className="gap-2">
                <ShieldCheck className="size-4" /> With Icon
              </Button>
              <Button size="icon" variant="outline">
                <CheckCircle2 className="size-4 text-primary" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        FinXUI Core Banking Workbench • Refactoring Reference Setup
      </footer>
    </div>
  );
}
