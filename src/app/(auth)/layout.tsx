import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel. Ruled like ledger paper rather than washed with a
          gradient — the surface this institution actually works on. */}
      <section className="ledger-rules relative flex flex-col justify-between bg-primary px-8 py-10 text-primary-foreground lg:px-14 lg:py-14">
        <p className="font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
          Janata Bank PLC.
        </p>

        <div className="my-12 max-w-xl lg:my-0">
          {/* জনতা means "the people" — the slogan comes from the bank's own
              name rather than generic finance language. */}
          <h1 className="font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight">
            The people’s bank.
            <br />
            <span className="opacity-80">Since 1972.</span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed opacity-85">
            State-owned, nationwide, and answerable to the people it is named
            for. Formed from United Bank and Union Bank under the Bank
            Nationalization Order.
          </p>

          {/* Everything a teller posts is dated by the business date, not the
              wall clock — so it gets stamped here like a voucher. */}
          <div className="date-stamp mt-10 inline-block border-2 border-current/45 px-5 py-3 font-mono uppercase">
            <p className="text-[10px] tracking-[0.25em] opacity-75">
              Business date
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {new Date().toISOString().split("T")[0]}
            </p>
            <p className="mt-1 text-[11px] tracking-[0.18em] opacity-75">
              HQ · 001
            </p>
          </div>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
          Core banking 4.2.1 · Production · Motijheel, Dhaka
        </p>
      </section>

      {/* Form panel */}
      <section className="relative flex flex-col justify-center bg-surface px-6 py-12 lg:px-14">
        {/* Absolute positioned Theme Toggle at the top right of this pane */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-sm">
          {children}

          <p className="mt-10 border-t border-border pt-5 text-[12px] leading-relaxed text-fg-muted text-center">
            Restricted system. Access is limited to authorised staff, and every
            sign-on attempt is recorded against your terminal and office.
          </p>
        </div>
      </section>
    </div>
  );
}
