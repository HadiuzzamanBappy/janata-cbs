"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";

export interface IcGeneralTabProps {
  formData: InquiryConfigRecord;
  updateConfig: (patch: Partial<InquiryConfigRecord>) => void;
  disabled?: boolean;
}

export function IcGeneralTab({ formData, updateConfig, disabled = false }: IcGeneralTabProps) {
  return (
    <Card className="max-w-2xl mt-2">
      <CardHeader>
        <CardTitle className="text-sm">Inquiry Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Inquiry ID / Code</Label>
            <Input
              placeholder="e.g. INQ.ACCOUNT.LIST"
              value={formData.id}
              disabled={disabled}
              onChange={(e) => updateConfig({ id: e.target.value.toUpperCase() })}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target Model</Label>
            <Input
              placeholder="e.g. ACCOUNT"
              value={formData.targetModel}
              disabled={disabled}
              onChange={(e) => updateConfig({ targetModel: e.target.value.toUpperCase() })}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Screen Title</Label>
          <Input
            placeholder="e.g. Customer Accounts Overview"
            value={formData.title}
            disabled={disabled}
            onChange={(e) => updateConfig({ title: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input
            placeholder="Short summary of this inquiry query"
            value={formData.description || ""}
            disabled={disabled}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="space-y-1 w-48">
          <Label className="text-xs">Default Page Size</Label>
          <Select
            value={String(formData.defaultPageSize || 25)}
            disabled={disabled}
            onValueChange={(val) => updateConfig({ defaultPageSize: Number(val) })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
