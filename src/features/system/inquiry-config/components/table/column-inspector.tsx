"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InquiryColumnConfig } from "@/lib/data-schemas/inquiry-config-schema";
import { FORMAT_OPTIONS } from "./table-constants";

export interface ColumnInspectorProps {
  activeCol?: InquiryColumnConfig;
  selectedColIdx: number;
  disabled?: boolean;
  onUpdateColumn: (index: number, patch: Partial<InquiryColumnConfig>) => void;
  onRemoveColumn: (index: number) => void;
}

export function ColumnInspector({
  activeCol,
  selectedColIdx,
  disabled = false,
  onUpdateColumn,
  onRemoveColumn,
}: ColumnInspectorProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* Right Header: Exactly matching left header height and baseline */}
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Column Inspector:
          </span>
          {activeCol && (
            <>
              <span className="text-xs font-bold text-foreground">
                {activeCol.label || activeCol.id}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase">
                {activeCol.format || "text"}
              </Badge>
            </>
          )}
        </div>

        {!disabled && activeCol && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveColumn(selectedColIdx)}
            className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
          >
            <Trash2 className="size-3" /> Delete
          </Button>
        )}
      </div>

      {/* Scrollable Form Content */}
      {activeCol ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* CBS Scanline Form */}
          <div className="space-y-2 text-xs">
            {/* Field Key */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Field Key :
              </Label>
              <Input
                value={activeCol.id}
                disabled={disabled}
                onChange={(e) => onUpdateColumn(selectedColIdx, { id: e.target.value.trim() })}
                className="h-7 text-xs font-mono bg-background rounded border-border/80 w-56"
                placeholder="e.g. accountNo"
              />
            </div>

            {/* Header Label */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Header Label :
              </Label>
              <Input
                value={activeCol.label}
                disabled={disabled}
                onChange={(e) => onUpdateColumn(selectedColIdx, { label: e.target.value })}
                className="h-7 text-xs bg-background rounded border-border/80 w-72"
                placeholder="e.g. Account Number"
              />
            </div>

            {/* Data Format */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Data Format :
              </Label>
              <Select
                value={activeCol.format || "text"}
                disabled={disabled}
                onValueChange={(val: string | null) =>
                  onUpdateColumn(selectedColIdx, {
                    format: (val || "text") as InquiryColumnConfig["format"],
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-1.5">
                        {opt.icon}
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cell Alignment */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Cell Alignment :
              </Label>
              <Select
                value={activeCol.align || "left"}
                disabled={disabled}
                onValueChange={(val: string | null) =>
                  onUpdateColumn(selectedColIdx, {
                    align: (val || "left") as InquiryColumnConfig["align"],
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="left">Left Aligned (Standard text & IDs)</SelectItem>
                  <SelectItem value="center">Center Aligned (Dates & Badges)</SelectItem>
                  <SelectItem value="right">Right Aligned (Amounts & Numbers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Column Width */}
            <div className="flex items-center gap-2">
              <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                Column Width :
              </Label>
              <div className="flex items-center gap-1.5 w-48">
                <Input
                  value={activeCol.width || ""}
                  disabled={disabled}
                  onChange={(e) => onUpdateColumn(selectedColIdx, { width: e.target.value })}
                  className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
                  placeholder="auto (or e.g. 140px, 10rem)"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onUpdateColumn(selectedColIdx, { width: undefined })}
                  className="h-7 text-[10px] px-2 rounded cursor-pointer"
                  title="Reset to automatic flex width"
                >
                  Auto
                </Button>
              </div>
            </div>

            {/* Options Toggles */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                  Typography :
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mono-toggle"
                    checked={Boolean(activeCol.isMono)}
                    disabled={disabled}
                    onCheckedChange={(val: boolean) =>
                      onUpdateColumn(selectedColIdx, { isMono: Boolean(val) })
                    }
                    className="rounded"
                  />
                  <Label
                    htmlFor="mono-toggle"
                    className="text-xs text-foreground cursor-pointer font-mono"
                  >
                    Monospace Font (Recommended for Accounts, IDs & Amounts)
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                  Interactivity :
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="sortable-toggle"
                      checked={activeCol.sortable !== false}
                      disabled={disabled}
                      onCheckedChange={(val: boolean) =>
                        onUpdateColumn(selectedColIdx, { sortable: Boolean(val) })
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor="sortable-toggle"
                      className="text-xs text-foreground cursor-pointer"
                    >
                      Sortable
                    </Label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="pinned-toggle"
                      checked={Boolean(activeCol.isPinned)}
                      disabled={disabled}
                      onCheckedChange={(val: boolean) =>
                        onUpdateColumn(selectedColIdx, { isPinned: Boolean(val) })
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor="pinned-toggle"
                      className="text-xs text-foreground cursor-pointer"
                    >
                      Pin Left
                    </Label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="visible-toggle"
                      checked={activeCol.visible !== false}
                      disabled={disabled}
                      onCheckedChange={(val: boolean) =>
                        onUpdateColumn(selectedColIdx, { visible: Boolean(val) })
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor="visible-toggle"
                      className="text-xs text-foreground cursor-pointer"
                    >
                      Visible
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center p-6 text-center text-muted-foreground">
          <p className="text-xs font-mono">
            Select a column from the list to inspect its properties.
          </p>
        </div>
      )}
    </div>
  );
}
