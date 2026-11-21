"use client";

import { Eye, Pencil, Play, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { evaluateCbsAccess } from "@/lib/cbs-access";
import { cbsCommand } from "@/lib/cbs-command";
import type { InquiryRowAction } from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import { auditDataSchema, type InquiryRow } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsUserSecurityContext } from "@/types";

const FUNCTION_ICONS: Partial<Record<CbsRecordFunction, typeof Eye>> = {
  [CbsRecordFunction.SEE]: Eye,
  [CbsRecordFunction.INPUT]: Pencil,
  [CbsRecordFunction.AUTHORIZE]: ShieldCheck,
};

/**
 * Why an action can't run for this row, or null. Rights and Four-Eyes come from
 * `evaluateCbsAccess`; the record-status rules apply only when the row carries its status.
 */
function disableReason(
  action: InquiryRowAction,
  row: InquiryRow,
  user: CbsUserSecurityContext | null,
): string | null {
  if (!action.command) return "This row has no value for the command's fields";
  if (!action.func) return null;
  const audit = auditDataSchema.safeParse(row.auditData);
  const recordStatus = audit.success ? audit.data.recStatus : undefined;
  const access = evaluateCbsAccess({
    user,
    recordStatus,
    recordInputter: audit.success ? audit.data.recInputter : undefined,
    mode: action.func,
  });
  if (recordStatus) return access.getDisableReason(action.func);
  if (!access.hasFunctionRight(action.func)) {
    return `Access Denied: Missing '${action.func}' capability in user profile.`;
  }
  return action.func === CbsRecordFunction.AUTHORIZE && access.isFourEyesViolation
    ? access.getDisableReason(action.func)
    : null;
}

export interface InquiryRowActionsProps {
  actions: readonly InquiryRowAction[];
  row: InquiryRow;
  user: CbsUserSecurityContext | null;
}

export function InquiryRowActions({ actions, row, user }: InquiryRowActionsProps) {
  if (actions.length === 0) return null;
  return (
    <div className="flex items-center gap-0.5 justify-center">
      {actions.map((action, idx) => {
        const reason = disableReason(action, row, user);
        const Icon = (action.func && FUNCTION_ICONS[action.func]) || Play;
        return (
          <Tooltip key={`${idx}:${action.label}`}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={action.label}
                  aria-disabled={Boolean(reason)}
                  onClick={() => {
                    if (!reason) cbsCommand.execute(action.command);
                  }}
                  data-cbs-command={reason ? undefined : action.command}
                  data-cbs-link-handled="true"
                  className={cn(
                    "inline-flex items-center justify-center size-5 rounded text-muted-foreground transition-colors",
                    reason
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer hover:bg-primary/15 hover:text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-2.5",
                      action.func === CbsRecordFunction.AUTHORIZE && "text-warning",
                    )}
                  />
                </button>
              }
            />
            <TooltipContent className="text-2xs font-medium">
              {reason ? `${action.label}: ${reason}` : `${action.label}: ${action.command}`}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
