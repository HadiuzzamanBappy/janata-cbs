"use client";

import { Edit, ExternalLink, Eye, FileText, History, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InquiryActionConfig } from "@/lib/data-schemas/inquiry-config-schema";

export interface ActionInspectorProps {
  activeAct?: InquiryActionConfig;
  selectedActIdx: number;
  targetModel?: string;
  disabled?: boolean;
  onUpdateAction: (index: number, patch: Partial<InquiryActionConfig>) => void;
  onRemoveAction: (index: number) => void;
}

export function ActionInspector({
  activeAct,
  selectedActIdx,
  targetModel = "ACCOUNT",
  disabled = false,
  onUpdateAction,
  onRemoveAction,
}: ActionInspectorProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* Right Header: Exactly matching left header height and baseline */}
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Action Inspector:
          </span>
          {activeAct && (
            <>
              <span className="text-xs font-bold text-foreground">
                {activeAct.label || activeAct.id}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase">
                {activeAct.actionType || "view"}
              </Badge>
            </>
          )}
        </div>

        {!disabled && activeAct && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveAction(selectedActIdx)}
            className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
          >
            <Trash2 className="size-3" /> Delete
          </Button>
        )}
      </div>

      {/* Scrollable Form Content */}
      {activeAct ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* CBS Scanline Form */}
          <div className="space-y-2 text-xs">
            {/* Action ID */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Action ID :
              </Label>
              <Input
                value={activeAct.id}
                disabled={disabled}
                onChange={(e) =>
                  onUpdateAction(selectedActIdx, { id: e.target.value.toUpperCase() })
                }
                className="h-7 text-xs font-mono uppercase bg-background rounded border-border/80 w-56"
                placeholder="e.g. VIEW_DETAILS"
              />
            </div>

            {/* Button Label */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Button Label :
              </Label>
              <Input
                value={activeAct.label}
                disabled={disabled}
                onChange={(e) => onUpdateAction(selectedActIdx, { label: e.target.value })}
                className="h-7 text-xs bg-background rounded border-border/80 w-72"
                placeholder="e.g. View Statement"
              />
            </div>

            {/* Target Command */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Target Command :
              </Label>
              <Input
                value={activeAct.targetCommand || ""}
                disabled={disabled}
                onChange={(e) => onUpdateAction(selectedActIdx, { targetCommand: e.target.value })}
                className="h-7 text-xs font-mono bg-background rounded border-border/80 w-64"
                placeholder={`e.g. ${targetModel || "ACCOUNT"},SEE`}
              />
            </div>

            {/* Action Type */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Action Type :
              </Label>
              <Select
                value={activeAct.actionType || "view"}
                disabled={disabled}
                onValueChange={(val: string | null) =>
                  onUpdateAction(selectedActIdx, {
                    actionType: (val || "view") as InquiryActionConfig["actionType"],
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="view">View (Read-Only Inspection)</SelectItem>
                  <SelectItem value="edit">Edit (Maintenance & Amend)</SelectItem>
                  <SelectItem value="command">Command (Execution / Reversal)</SelectItem>
                  <SelectItem value="drilldown">Drilldown (Sub-inquiry)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Icon */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Button Icon :
              </Label>
              <Select
                value={activeAct.icon || "eye"}
                disabled={disabled}
                onValueChange={(val: string | null) =>
                  onUpdateAction(selectedActIdx, {
                    icon: (val || "eye") as InquiryActionConfig["icon"],
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="eye">
                    <div className="flex items-center gap-1.5">
                      <Eye className="size-3 text-primary" />
                      <span>Eye (Inspect / View)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-1.5">
                      <Edit className="size-3 text-amber-500" />
                      <span>Edit (Pencil / Amend)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rotate-ccw">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="size-3 text-destructive" />
                      <span>Rotate (Reverse / Undo)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="history">
                    <div className="flex items-center gap-1.5">
                      <History className="size-3 text-purple-500" />
                      <span>History (Audit Trail)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="file-text">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-3 text-emerald-500" />
                      <span>Document (Statement / Advice)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="external-link">
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="size-3 text-sky-500" />
                      <span>External Link (Jump)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Open Mode */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Open Mode :
              </Label>
              <Select
                value={activeAct.openMode || "tab"}
                disabled={disabled}
                onValueChange={(val: string | null) =>
                  onUpdateAction(selectedActIdx, {
                    openMode: (val || "tab") as InquiryActionConfig["openMode"],
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="tab">New Workspace Tab</SelectItem>
                  <SelectItem value="popup">Modal Dialog / Pop-up</SelectItem>
                  <SelectItem value="drilldown">In-Place Drilldown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parameter Field */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                ID Param Field :
              </Label>
              <Input
                value={activeAct.idParamField || "recordId"}
                disabled={disabled}
                onChange={(e) => onUpdateAction(selectedActIdx, { idParamField: e.target.value })}
                className="h-7 text-xs font-mono bg-background rounded border-border/80 w-56"
                placeholder="e.g. recordId or accountNo"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
          <p className="text-xs font-mono">
            Select an action button from the list to inspect its properties.
          </p>
        </div>
      )}
    </div>
  );
}
