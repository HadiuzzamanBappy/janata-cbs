import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import logo from "@/app/icon.png";
import { ThemeToggle } from "@/components/layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const currentDate = new Date().toISOString().split("T")[0];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-12 overflow-hidden select-none">
      {/* Absolute Positioned Theme Toggle at Page Level */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Textured Background Grid Pattern */}

      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0,transparent_100%)] opacity-10 pointer-events-none" />

      {/* Background Decorative Mesh Shapes */}
      <div className="absolute top-1/4 -left-20 size-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 size-80 rounded-full bg-primary/25 blur-3xl pointer-events-none" />

      {/* Floating Modern Split Card Container */}
      <div className="relative z-10 w-full max-w-4xl bg-card rounded-2xl border border-border/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Side: Modern Minimalist Brand Column (5 Cols - Hidden on Mobile) */}
        <section className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground p-8 flex-col justify-between relative overflow-hidden">
          {/* Subtle Grid Accent Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

          {/* Header Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md shrink-0 border border-border/40">
              <Image src={logo} alt="Janata Bank PLC" className="size-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-primary-foreground leading-none">
                Janata Bank PLc.
              </span>
              <span className="text-[11px] text-primary-foreground/80 font-mono mt-1">
                Your committed partner in progress
              </span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-8 space-y-4">
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              Formed in 1972. State-owned commercial banking infrastructure powering financial
              transactions across Bangladesh.
            </p>

            {/* Voucher Date Badge */}
            <div className="pt-2">
              <div className="inline-flex flex-col rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 px-3.5 py-2.5 font-mono">
                <span className="text-[10px] text-primary-foreground/70 uppercase tracking-wider">
                  Active Business Date
                </span>
                <span className="text-lg font-bold text-primary-foreground mt-0.5">
                  {currentDate}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <p className="relative z-10 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">
            Core banking · Motijheel, Dhaka
          </p>
        </section>

        {/* Right Side: High-Density Form Panel (Full width on mobile, 7 Cols on desktop) */}
        <section className="col-span-12 lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-between bg-card relative">
          {/* Form Content */}
          <div className="my-auto py-6 space-y-6">{children}</div>

          {/* Bottom Confidentiality & Security Disclaimer */}
          <div className="pt-4 border-t border-border/60 flex flex-col items-center text-center gap-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <span>Restricted System & Confidentiality Notice</span>
            </div>
            <p className="leading-relaxed text-[11px] max-w-sm opacity-85">
              Access is limited strictly to authorised staff. Every sign-on attempt is recorded and
              audited against your terminal and office IP.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
