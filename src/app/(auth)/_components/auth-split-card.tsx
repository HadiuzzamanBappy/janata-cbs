"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from "@/app/icon.png";
import { clientConfig } from "@/lib/core-config";
import { cn } from "@/lib/core-utils";

interface AuthSplitCardProps {
  currentDate: string;
  children: React.ReactNode;
}

export function AuthSplitCard({ currentDate, children }: AuthSplitCardProps) {
  const pathname = usePathname();
  const hideLeftPanel = pathname.startsWith(clientConfig.routes.changePassword);

  return (
    <div className="relative z-10 w-full max-w-4xl bg-card rounded-lg border border-border/80 shadow-2xl overflow-hidden flex min-h-145">
      {/* Left Side: Modern Minimalist Brand Column (5/12 on Desktop — Smoothly slides to hide on Change Password) */}
      <section
        aria-hidden={hideLeftPanel}
        className={cn(
          "hidden lg:flex shrink-0 overflow-hidden transition-[width,opacity] duration-500 ease-in-out",
          hideLeftPanel ? "lg:w-0 opacity-0 pointer-events-none" : "lg:w-5/12 opacity-100",
        )}
      >
        <div
          className={cn(
            "w-[23.333333rem] shrink-0 bg-linear-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground p-8 flex flex-col justify-between relative overflow-hidden transition-transform duration-500 ease-in-out",
            hideLeftPanel ? "-translate-x-full" : "translate-x-0",
          )}
        >
          {/* Subtle Grid Accent Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[16px_16px] opacity-40 pointer-events-none" />

          {/* Header Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="size-10 rounded-md bg-white p-1.5 flex items-center justify-center shadow-md shrink-0 border border-border/40">
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
              <div className="inline-flex flex-col rounded-md bg-primary-foreground/10 border border-primary-foreground/20 px-3.5 py-2.5 font-mono">
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
        </div>
      </section>

      {/* Right Side: High-Density Form Panel (Full width on mobile, smoothly expands on Change Password) */}
      <section className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 flex flex-col justify-between bg-card relative">
        {/* Form Content — keeps consistent login form width while smoothly centering */}
        <div className="my-auto py-6 space-y-6 w-full max-w-md mx-auto">{children}</div>
      </section>
    </div>
  );
}
