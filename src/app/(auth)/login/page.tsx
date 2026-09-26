import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign on — Janata Bank PLC.",
  description: "Core banking sign-on for Janata Bank PLC. staff.",
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Sign on</h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          Use the credentials issued by your branch administrator.
        </p>
      </div>

      <LoginForm />
    </>
  );
}
