import { queryOptions } from "@tanstack/react-query";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import { parseGfcResponse, parseInquiryConfig, parseMNU } from "@/lib/data-parsers";
import type {
  FormConfigRecord,
  InquiryConfigRecord,
  MenuItem,
  ModelConfigRecord,
} from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "../payloads/base-model";
import { formConfigPayloads } from "../payloads/form-config";
import { menuTreePayloads } from "../payloads/menu-tree";
import { modelConfigPayloads } from "../payloads/model-config";
import { sendCbsRequest } from "../transport/proxy-client";

export interface ResolvedFormSchemaData {
  schema: FormConfigRecord | null;
  modelRecord: ModelConfigRecord | null;
}

export const SCHEMA_ROOT_KEYS = {
  formConfig: ["cbs", "form-schema"] as const,
  inquiryConfig: ["cbs", "inquiry-schema"] as const,
} as const;

const inquiryConfigPayloads = createModelPayloads(CbsControlTable.INQUIRY_CONFIG);

/**
 * Fetches and unwraps a single MODEL.CONFIG metamodel record ('GMC').
 */
export async function loadModelConfigRecord(modelId: string): Promise<ModelConfigRecord> {
  const cleanId = modelId.split("$")[0].split(",")[0].trim().toUpperCase();
  const res = await sendCbsRequest<{ record?: ModelConfigRecord } | ModelConfigRecord>(
    modelConfigPayloads.get(cleanId),
    { silent: true },
  );
  if (res.status !== "SUCCESS" || !res.data) {
    throw new Error(res.message || `Failed to load MODEL.CONFIG for "${cleanId}"`);
  }
  const raw = res.data as { record?: ModelConfigRecord } | ModelConfigRecord;
  return ("record" in raw && raw.record ? raw.record : raw) as ModelConfigRecord;
}

/**
 * Tier: Screen Blueprints & Metadata Schemas (Sidebar Navigation, Forms, Inquiries, Metamodels).
 */
export const schemaQueries = {
  menuTreeActive: () =>
    queryOptions<MenuItem[]>({
      queryKey: ["app", "sidebar", "menu-tree"] as const,
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(menuTreePayloads.get(), { silent: true });
        if (res.status !== "SUCCESS") {
          throw new Error(res.message || "Failed to load navigation menu tree");
        }
        if (!res.data) return [];
        const parsed = parseMNU(res.data);
        if (!parsed.success) {
          throw new Error(parsed.error || "Failed to parse navigation menu tree");
        }
        return parsed.data;
      },
    }),

  modelConfigRecord: (modelId: string) => {
    const cleanId = modelId.split("$")[0].split(",")[0].trim().toUpperCase();
    return queryOptions<ModelConfigRecord>({
      queryKey: ["cbs", "model-config", "record", cleanId] as const,
      enabled: Boolean(cleanId),
      staleTime: 5 * 60 * 1000,
      queryFn: () => loadModelConfigRecord(cleanId),
    });
  },

  formConfigSchema: (command: string) => {
    const cleanCmd = command ? command.trim().toUpperCase() : "";
    return queryOptions<ResolvedFormSchemaData>({
      queryKey: [...SCHEMA_ROOT_KEYS.formConfig, cleanCmd] as const,
      enabled: Boolean(cleanCmd),
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        if (cleanCmd.includes(",")) {
          const [app, version] = cleanCmd.split(",");
          if (version?.trim()) {
            const formRes = await sendCbsRequest<Record<string, unknown>>(
              formConfigPayloads.get(cleanCmd),
              { silent: true },
            );
            if (formRes.status === "SUCCESS" && formRes.data) {
              const parsed = parseGfcResponse(formRes.data);
              if (parsed.success && parsed.data.form?.frmElements) {
                const { model, form } = parsed.data;
                return { schema: model ? compileFormSpec(model, form) : form, modelRecord: model };
              }
              const rawData = formRes.data;
              const formConfig = (rawData.frmElements ? rawData : null) as FormConfigRecord | null;
              if (formConfig?.frmElements) {
                let model: ModelConfigRecord | null = null;
                try {
                  model = await loadModelConfigRecord(String(app || cleanCmd));
                } catch {
                  // Standalone form without model
                }
                return {
                  schema: model ? compileFormSpec(model, formConfig) : formConfig,
                  modelRecord: model,
                };
              }
            }
            throw new Error(
              `Version "${cleanCmd}" does not exist in FORM.CONFIG. Please verify the version or create it in Form Design.`,
            );
          }
        }

        const baseModel = cleanCmd.split(",")[0].trim();
        const model = await loadModelConfigRecord(baseModel);
        if ("PROPERTIES" in model) {
          return { schema: compileFormSpec(model, null), modelRecord: model };
        }
        throw new Error(`No data model schema registered in MODEL.CONFIG for "${baseModel}"`);
      },
    });
  },

  inquiryConfigSchema: (command: string) => {
    const cleanCmd = command.trim().toUpperCase();
    return queryOptions<InquiryConfigRecord>({
      queryKey: [...SCHEMA_ROOT_KEYS.inquiryConfig, cleanCmd] as const,
      enabled: Boolean(cleanCmd),
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(inquiryConfigPayloads.get(cleanCmd), {
          silent: true,
        });
        if (res.status !== "SUCCESS" || !res.data) {
          throw new Error(res.message || `Failed to fetch inquiry schema for "${cleanCmd}"`);
        }
        const parsedRecord = parseInquiryConfig(res.data);
        return parsedRecord.success ? parsedRecord.data : (res.data as InquiryConfigRecord);
      },
    });
  },
};
