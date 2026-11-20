"use client";

import * as React from "react";
import { cbsCommand } from "@/lib/cbs-command";

/** Standard authorization level: the record waits for a checker. */
const DEFAULT_AUTH_LEVEL = 1;

const CbsAuthLevelContext = React.createContext<number>(DEFAULT_AUTH_LEVEL);

/**
 * Publishes the screen's authorization level, parsed once from its command. A trailing comma
 * (`FC,`, `CUSTOMER,KYC,`) is level 0 (zero-auth). `ScreenLoader` mounts this around every screen,
 * so tabs, popups, bespoke and dynamic screens all read the same value.
 */
export function CbsAuthLevelProvider({
  command,
  children,
}: {
  command: string;
  children: React.ReactNode;
}) {
  const authLevel = React.useMemo(() => cbsCommand.parse(command).authLevel, [command]);
  return <CbsAuthLevelContext.Provider value={authLevel}>{children}</CbsAuthLevelContext.Provider>;
}

/** The current screen's authorization level (1 outside a screen). */
export function useCbsAuthLevel(): number {
  return React.useContext(CbsAuthLevelContext);
}
