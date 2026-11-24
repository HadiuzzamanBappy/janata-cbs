import { queryOptions } from "@tanstack/react-query";
import { compileFormSpec } from "@/lib/cbs-form-spec";
import {
  extractModelConfigRecord,
  parseGfcResponse,
  parseInquiryConfig,
  parseMNU,
} from "@/lib/data-parsers";
import {
  CBS_API_STATUS,
  type FormConfigRecord,
  type InquiryConfigRecord,
  isApiSuccess,
  type MenuItem,
  type ModelConfigRecord,
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
 * The core answered that the model does not exist (an empty success, or RECORD_NOT_FOUND / 404).
 * Any other failure is a plain Error, so a designer never mistakes an outage for a new model.
 */
export class ModelConfigNotFoundError extends Error {}

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
        if (!isApiSuccess(res)) {
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
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(modelConfigPayloads.get(cleanId), {
          silent: true,
        });
        const record = isApiSuccess(res) ? extractModelConfigRecord(res.data) : null;
        if (!record) {
          const message = res.message || `Failed to load MODEL.CONFIG for "${cleanId}"`;
          const notFound =
            isApiSuccess(res) ||
            res.status === CBS_API_STATUS.RECORD_NOT_FOUND ||
            res.statusCode === 404;
          throw notFound ? new ModelConfigNotFoundError(message) : new Error(message);
        }
        // Not schema-validated on purpose: designers must be able to open invalid records to fix them.
        return record as ModelConfigRecord;
      },
    });
  },

  /**
   * An operational form is a CONFIG.FORM entry, read only by GFC (the core sends its model with it).
   * `ACCOUNT` and `ACCOUNT,` read the entry "ACCOUNT"; `ACCOUNT,1.0.0` reads that version.
   * No entry means no form: nothing is built from the model alone.
   */
  formConfigSchema: (command: string) => {
    const [app = "", version = ""] = (command || "")
      .trim()
      .toUpperCase()
      .split(",")
      .map((part) => part.trim());
    const formId = version ? `${app},${version}` : app;
    return queryOptions<ResolvedFormSchemaData>({
      queryKey: [...SCHEMA_ROOT_KEYS.formConfig, formId] as const,
      enabled: Boolean(formId),
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<Record<string, unknown>>(formConfigPayloads.get(formId), {
          silent: true,
        });
        if (!isApiSuccess(res)) {
          throw new Error(res.message || `Failed to load form "${formId}" from CONFIG.FORM`);
        }
        const parsed = res.data ? parseGfcResponse(res.data) : null;
        if (!parsed?.success) {
          throw new Error(`Form "${formId}" response from CONFIG.FORM is empty or invalid`);
        }
        const { model, form, isNew } = parsed.data;
        if (!isNew && !form) {
          throw new Error(`Form "${formId}" in CONFIG.FORM could not be read`);
        }
        if (!form?.frmElements.sections.length) {
          throw new Error(`No form "${formId}" in CONFIG.FORM. Create it in Form Design (FC).`);
        }
        return { schema: compileFormSpec(model, form), modelRecord: model };
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
        if (!isApiSuccess(res) || !res.data) {
          throw new Error(res.message || `Failed to fetch inquiry schema for "${cleanCmd}"`);
        }
        const parsedRecord = parseInquiryConfig(res.data);
        if (!parsedRecord.success) throw new Error(parsedRecord.error);
        return parsedRecord.data;
      },
    });
  },
};
