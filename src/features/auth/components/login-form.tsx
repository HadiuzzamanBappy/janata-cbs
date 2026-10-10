"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/lib/core-config";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showUsername, setShowUsername] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(appConfig.routes.api.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Login failed. Please check your credentials.",
        );
      }

      if (data.user?.initLogin) {
        router.push(appConfig.routes.changePassword);
      } else {
        router.push(appConfig.routes.dashboard);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs font-medium text-foreground">
          Username
        </Label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            type={showUsername ? "text" : "password"}
            placeholder="e.g. TELLER01"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            autoComplete="username"
            className="h-9 text-xs pr-8"
          />
          <button
            type="button"
            onClick={() => setShowUsername((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            aria-label={showUsername ? "Hide username" : "Show username"}
            tabIndex={-1}
          >
            {showUsername ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
            className="h-9 text-xs pr-8"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>
      <Button type="submit" size="sm" className="w-full h-9 font-medium text-xs" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Authenticating...
          </>
        ) : (
          "Sign on"
        )}
      </Button>
    </form>
  );
}
