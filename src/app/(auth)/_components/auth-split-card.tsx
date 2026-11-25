"use client";

import Image from "next/image";
import logo from "@/app/icon.png";
import { ThemeToggle } from "@/components/cbs-settings";

interface AuthSplitCardProps {
  currentDate: string;
  children: React.ReactNode;
}

export function AuthSplitCard({ currentDate, children }: AuthSplitCardProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Flowing Bottom Wave Vector */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 xl:h-56 z-0">
        <Image
          src="/images/login-waves.svg"
          alt=""
          fill
          unoptimized
          className="object-cover object-bottom"
        />
      </div>

      {/* Left Side: Full-Height Brand & Network Panel */}
      <section className="hidden lg:flex lg:flex-1 relative z-10 flex-col justify-between p-10 xl:p-14 overflow-hidden">
        {/* Global Network Map Vector */}
        <div className="pointer-events-none absolute inset-y-0 left-[20%] right-4 xl:right-8 flex items-center justify-end opacity-90">
          <Image
            src="/images/login-network-map.svg"
            alt=""
            width={1000}
            height={367}
            unoptimized
            className="w-full h-auto max-w-4xl object-contain"
          />
        </div>

        {/* Top Header Branding */}
        <header className="relative z-10 flex items-center gap-3.5">
          <div className="size-10 rounded-md flex items-center justify-center shadow-xs shrink-0">
            <Image src={logo} alt="Janata Bank PLC" className="size-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight uppercase text-foreground leading-none">
              Janata Bank PLC
            </span>
            <span className="text-3xs text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">
              Your committed partner in progress
            </span>
          </div>
        </header>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-auto max-w-xl py-12">
          <p className="text-xs font-medium text-primary mb-4 tracking-wide">
            JBPLC — Core Banking System
          </p>
          <h1 className="text-4xl xl:text-5xl tracking-tight leading-[1.12] text-foreground">
            <span className="block font-light">Trusted</span>
            <span className="block font-light">banking,</span>
            <span className="block font-bold">at every counter.</span>
          </h1>
        </div>

        {/* Bottom Metadata Row */}
        <footer className="relative z-10 flex items-center gap-12 xl:gap-16 pt-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-3xs font-mono uppercase tracking-wider text-muted-foreground">
              Established
            </span>
            <span className="text-xs font-semibold font-mono tabular-nums text-foreground">
              1972
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-3xs font-mono uppercase tracking-wider text-muted-foreground">
              System
            </span>
            <span className="text-xs font-semibold text-foreground">Core Banking</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-3xs font-mono uppercase tracking-wider text-muted-foreground">
              Business Date
            </span>
            <span className="text-xs font-semibold font-mono tabular-nums text-foreground">
              {currentDate}
            </span>
          </div>
        </footer>
      </section>

      {/* Right Side: Full-Height Auth Form Panel */}
      <section className="relative z-10 w-full lg:w-[500px] xl:w-[560px] shrink-0 min-h-screen bg-card/80 lg:border-l border-border/80 flex flex-col justify-between p-6 sm:p-10">
        {/* Top Right Theme Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-3 pb-4 lg:pb-0 border-b lg:border-b-0 border-border/60">
          {/* Compact Brand Header on Mobile/Tablet */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-background p-1 flex items-center justify-center border border-border/80 shrink-0">
              <Image src={logo} alt="Janata Bank PLC" className="size-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs uppercase tracking-tight text-foreground leading-none">
                Janata Bank PLC
              </span>
              <span className="text-3xs text-muted-foreground font-mono mt-0.5">{currentDate}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Centered Form Content */}
        <div className="my-auto w-full max-w-sm mx-auto py-8">{children}</div>

        {/* Bottom Security Notice */}
        <footer className="pt-4 border-t border-border/50">
          <p className="text-3xs leading-relaxed text-muted-foreground">
            Authorised use only. Activity is logged and monitored. © {new Date().getFullYear()}{" "}
            Janata Bank PLC.
          </p>
        </footer>
      </section>
    </div>
  );
}
