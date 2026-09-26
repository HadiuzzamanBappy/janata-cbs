import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign on — Janata Bank PLC.",
  description: "Core banking sign-on for Janata Bank PLC. staff.",
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome User</h2>
        <p className="text-xs text-muted-foreground">
          Use the credentials issued by your branch administrator.
        </p>
      </div>

      <LoginForm />
    </>
  );
}
