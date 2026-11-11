import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePassword } from "@/features/auth";
import { clientConfig } from "@/lib/core-config";
import { getSession } from "@/lib/infra-redis";

export const metadata: Metadata = {
  title: "Change Password — Janata Bank PLC.",
  description: "Set a new password for your initial login.",
};

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) {
    redirect(clientConfig.routes.login);
  }
  if (!session.currUser.initLogin) {
    redirect(clientConfig.routes.dashboard);
  }

  return (
    <>
      <div className="mb-6 text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Action Required</h2>
        <p className="text-xs text-muted-foreground">
          Initial sign-on for{" "}
          <span className="font-mono font-medium text-foreground">{session.currUser.userId}</span>.
          Set a new password to continue.
        </p>
      </div>

      <ChangePassword />
    </>
  );
}
