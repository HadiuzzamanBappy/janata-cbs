/**
 * @fileoverview Rules tab of the field inspector: add, edit and remove a field's validation,
 * visibility, cascade and automation rules.
 *
 * @module features/system/form-config/components/designer/inspector/inspector-rules-pane
 */

"use client";

import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FormElement } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import type { useFieldRuleView } from "./use-field-rule-view";

export interface InspectorRulesPaneProps {
  ruleView: ReturnType<typeof useFieldRuleView>;
  onUpdateField: (patch: Partial<FormElement>) => void;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled: boolean;
}

export function InspectorRulesPane({
  ruleView,
  onUpdateField,
  onChange,
  disabled,
}: InspectorRulesPaneProps) {
  const { activeRules, availableRules, activeRuleSections, ruleValues } = ruleView;

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configured Rules ({activeRules.size})
        </span>
        {availableRules.length > 0 && !disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-2xs px-2 gap-1 cursor-pointer font-medium"
                >
                  <Plus className="w-3 h-3 text-primary" />
                  <span>Add Rule</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-auto min-w-44 p-1 text-xs">
              {availableRules.map((r) => (
                <DropdownMenuItem
                  key={r.kind}
                  onClick={() => onUpdateField(ruleView.getAddRulePatch(r.kind))}
                  title={r.description}
                  className="cursor-pointer py-1 px-2 text-xs font-medium"
                >
                  {r.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {activeRuleSections.length === 0 ? (
        <div className="rounded border border-dashed border-border/70 p-4 text-center space-y-1.5 bg-muted/10">
          <ShieldCheck className="w-5 h-5 text-muted-foreground/40 mx-auto" />
          <p className="text-2xs text-muted-foreground font-medium">
            No active rules on this field.
          </p>
          <p className="text-3xs text-muted-foreground/60 max-w-55 mx-auto">
            Click <span className="font-semibold text-foreground">+ Add Rule</span> to attach
            validation, conditional visibility, cascades, or automation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRuleSections.map(({ kind, section }) => (
            <div key={section.id} className="relative group">
              <div className="absolute right-2.5 top-2 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdateField(ruleView.getRemoveRulePatch(kind))}
                  disabled={disabled}
                  className="h-4 w-4 p-0 text-muted-foreground/60 hover:text-destructive hover:bg-transparent cursor-pointer"
                  title="Remove this rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <FormRenderer
                frmElements={{ sections: [section] }}
                values={ruleValues}
                onChange={onChange}
                disabled={disabled}
                mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
                layout="stacked"
                className="overflow-visible"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
