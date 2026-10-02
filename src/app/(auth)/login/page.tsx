import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth";
import { appConfig } from "@/lib/config";
import { getSession } from "@/lib/redis";

export const metadata: Metadata = {
  title: "Sign on — Janata Bank PLC.",
  description: "Core banking sign-on for Janata Bank PLC. staff.",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(appConfig.routes.dashboard);
  }

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
