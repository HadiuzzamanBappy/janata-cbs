"use client";

import {
  Database,
  ListPlus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ModelProperty, PropertyType } from "../types";

export const PROPERTY_TYPES: PropertyType[] = [
  "Text",
  "Number",
  "Date",
  "Boolean",
  "Dropdown",
  "Checkbox",
  "Radio",
  "Textarea",
  "Object",
  "Array",
];

interface McPropertyTableProps {
  properties: ModelProperty[];
  isReadOnly: boolean;
  onAddField: () => void;
  onUpdateField: (sn: string, patch: Partial<ModelProperty>) => void;
  onRemoveField: (sn: string) => void;
  onOpenOptions: (sn: string) => void;
}

export function McPropertyTable({
  properties,
  isReadOnly,
  onAddField,
  onUpdateField,
  onRemoveField,
  onOpenOptions,
}: McPropertyTableProps) {
  const [searchFilter, setSearchFilter] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  const filteredProperties = React.useMemo(() => {
    return properties.filter((p) => {
      const matchSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        p.label.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        p.sn.includes(searchFilter.trim());
      const matchType = typeFilter === "ALL" || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [properties, searchFilter, typeFilter]);

  return (
    <div className="flex-1 rounded border border-border/80 bg-card/60 flex flex-col overflow-hidden shadow-2xs min-h-0">
      {/* Table Toolbar */}
      <div className="px-2 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database className="size-3" />
          </div>
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
            Schema Properties
          </span>
          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-semibold border border-primary/20">
            {properties.length}
          </span>
        </div>

        {/* Filter and Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Quick Search */}
          <div className="relative w-36 sm:w-44">
            <Search className="size-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter fields..."
              className="h-7 text-xs pl-7 pr-2 rounded bg-background border-border/80 focus:bg-background"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
            <SelectTrigger size="sm" className="h-7 text-xs w-24 rounded border-border/80 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded">
              <SelectItem value="ALL" className="text-xs rounded">
                All Types
              </SelectItem>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs rounded">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Field Button */}
          {!isReadOnly && (
            <Button
              type="button"
              size="sm"
              onClick={onAddField}
              className="h-7 text-xs gap-1 px-2.5 font-medium rounded shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Field</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground text-[10px] uppercase font-semibold tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <th className="py-1 px-2 w-10 text-center">#</th>
              <th className="py-1 px-2 w-44">Field Name</th>
              <th className="py-1 px-2 w-44">Display Label</th>
              <th className="py-1 px-2 w-32">Data Type</th>
              <th className="py-1 px-2 w-24 text-center">Structure</th>
              <th className="py-1 px-2 w-16 text-center">Length</th>
              <th className="py-1 px-2 w-16 text-center">Width</th>
              <th className="py-1 px-2 w-14 text-center">Req</th>
              <th className="py-1 px-2 w-28 text-center">Enum / Options</th>
              {!isReadOnly && <th className="py-1 px-2 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredProperties.map((prop) => (
              <tr
                key={prop.sn}
                className="hover:bg-muted/30 transition-colors group"
              >
                {/* Index / SN */}
                <td className="py-1 px-2 text-center font-mono font-bold text-primary text-[11px]">
                  {prop.sn}
                </td>

                {/* Property Name */}
                <td className="py-1 px-2">
                  <Input
                    value={prop.name}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onUpdateField(prop.sn, {
                        name: e.target.value.replace(/\s+/g, ""),
                      })
                    }
                    placeholder="FIELD_NAME"
                    className="h-6.5 font-mono text-[11px] rounded bg-background border-border/80 focus:bg-background"
                  />
                </td>

                {/* Label */}
                <td className="py-1 px-2">
                  <Input
                    value={prop.label}
                    disabled={isReadOnly}
                    onChange={(e) => onUpdateField(prop.sn, { label: e.target.value })}
                    placeholder="Field Label"
                    className="h-6.5 text-[11px] rounded bg-background border-border/80 focus:bg-background"
                  />
                </td>

                {/* Type */}
                <td className="py-1 px-2">
                  <Select
                    value={prop.type}
                    disabled={isReadOnly}
                    onValueChange={(val) => {
                      if (val) onUpdateField(prop.sn, { type: val as PropertyType });
                    }}
                  >
                    <SelectTrigger className="h-6.5 text-[11px] rounded bg-background border-border/80 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded">
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs rounded">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Structure: Single vs Multi */}
                <td className="py-1 px-2 text-center">
                  <Badge
                    variant={prop.structure === "M" ? "secondary" : "outline"}
                    className="cursor-pointer font-mono text-[10px] h-5 px-1.5 rounded hover:border-primary/50 select-none"
                    onClick={() =>
                      !isReadOnly &&
                      onUpdateField(prop.sn, {
                        structure: prop.structure === "S" ? "M" : "S",
                      })
                    }
                    title="Click to toggle Single (S) / Multi-value (M)"
                  >
                    {prop.structure === "S" ? "Single (S)" : "Multi (M)"}
                  </Badge>
                </td>

                {/* Length */}
                <td className="py-1 px-2 text-center">
                  <Input
                    type="number"
                    value={prop.length}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onUpdateField(prop.sn, { length: Number(e.target.value) || 0 })
                    }
                    className="h-6.5 text-[11px] text-center w-14 mx-auto font-mono rounded bg-background border-border/80"
                  />
                </td>

                {/* Width */}
                <td className="py-1 px-2 text-center">
                  <Input
                    type="number"
                    value={prop.width}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onUpdateField(prop.sn, { width: Number(e.target.value) || 200 })
                    }
                    className="h-6.5 text-[11px] text-center w-14 mx-auto font-mono rounded bg-background border-border/80"
                  />
                </td>

                {/* Required Checkbox */}
                <td className="py-1 px-2 text-center">
                  <input
                    type="checkbox"
                    checked={prop.required}
                    disabled={isReadOnly}
                    onChange={(e) => onUpdateField(prop.sn, { required: e.target.checked })}
                    className="size-3.5 rounded accent-primary cursor-pointer align-middle"
                  />
                </td>

                {/* Options / Config */}
                <td className="py-1 px-2 text-center">
                  {prop.type === "Dropdown" ||
                  prop.type === "Radio" ||
                  prop.type === "Array" ||
                  prop.type === "Object" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenOptions(prop.sn)}
                      className="h-5.5 text-[10px] gap-1 px-1.5 font-mono rounded border-border/80 hover:border-primary/50"
                    >
                      <ListPlus className="size-2.5 text-primary" />
                      {prop.options?.length ? `${prop.options.length} items` : "Options"}
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40 font-mono">—</span>
                  )}
                </td>

                {/* Delete Action */}
                {!isReadOnly && (
                  <td className="py-1 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveField(prop.sn)}
                      title="Remove Field"
                      className="size-5.5 inline-flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground/60 transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {filteredProperties.length === 0 && (
              <tr>
                <td
                  colSpan={isReadOnly ? 9 : 10}
                  className="text-center py-8 text-xs text-muted-foreground"
                >
                  {properties.length === 0
                    ? "No schema fields defined yet. Click \"+ Add Field\" to create one."
                    : "No fields match your filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
