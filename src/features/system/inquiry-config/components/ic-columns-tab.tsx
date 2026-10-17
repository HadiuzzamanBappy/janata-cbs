"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InquiryColumnConfig } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcColumnsTabProps {
  columns: InquiryColumnConfig[];
  onAddColumn: (col: InquiryColumnConfig) => void;
  onUpdateColumn: (index: number, patch: Partial<InquiryColumnConfig>) => void;
  onRemoveColumn: (index: number) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

export function IcColumnsTab({
  columns,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onReorderColumns,
  disabled = false,
}: IcColumnsTabProps) {
  const [newColId, setNewColId] = React.useState("");
  const [newColLabel, setNewColLabel] = React.useState("");

  const handleAdd = () => {
    if (!newColId.trim() || !newColLabel.trim()) return;
    onAddColumn({
      id: newColId.trim(),
      label: newColLabel.trim(),
      align: "left",
      format: "text",
      isMono: false,
      sortable: true,
      visible: true,
      isPinned: false,
    });
    setNewColId("");
    setNewColLabel("");
  };

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden mt-2">
      {!disabled && (
        <div className="flex items-center gap-2 p-2 bg-muted/30 border border-border/60 rounded-md shrink-0">
          <Input
            placeholder="Field ID (e.g. accountNo)"
            value={newColId}
            onChange={(e) => setNewColId(e.target.value)}
            className="h-8 text-xs font-mono w-48 bg-background"
          />
          <Input
            placeholder="Column Header Label"
            value={newColLabel}
            onChange={(e) => setNewColLabel(e.target.value)}
            className="h-8 text-xs w-48 bg-background"
          />
          <Button size="sm" onClick={handleAdd} className="h-8 text-xs gap-1">
            <Plus className="size-3.5" /> Add Column
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto border border-border/60 rounded-md bg-card">
        <div className="divide-y divide-border/40">
          {columns.map((col, index) => (
            <div
              key={col.id}
              className="flex items-center gap-3 p-2.5 hover:bg-muted/20 text-xs transition-colors"
            >
              <span className="font-mono text-muted-foreground w-6 text-center">{index + 1}</span>
              <div className="w-40 font-mono font-medium truncate">{col.id}</div>
              <Input
                value={col.label}
                disabled={disabled}
                onChange={(e) => onUpdateColumn(index, { label: e.target.value })}
                className="h-7 text-xs w-44"
              />

              <Select
                value={col.format || "text"}
                disabled={disabled}
                onValueChange={(val) =>
                  onUpdateColumn(index, {
                    format: val as "text" | "currency" | "date" | "account" | "badge" | "number",
                  })
                }
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={col.align || "left"}
                disabled={disabled}
                onValueChange={(val) =>
                  onUpdateColumn(index, { align: val as "left" | "center" | "right" })
                }
              >
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>

              {!disabled && (
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === 0}
                    onClick={() => onReorderColumns(index, index - 1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === columns.length - 1}
                    onClick={() => onReorderColumns(index, index + 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveColumn(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
