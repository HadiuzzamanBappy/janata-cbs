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
import { CbsControlTable, CbsRecordFunction } from "@/types";
import { createModelPayloads } from "../payloads/base-model";
import { formConfigPayloads } from "../payloads/form-config";
import { menuTreePayloads } from "../payloads/menu-tree";
import { sendCbsRequest } from "../transport/proxy-client";

export const SCHEMA_ROOT_KEYS = {
  formConfig: ["cbs", "form-schema"] as const,
  inquiryConfig: ["cbs", "inquiry-schema"] as const,
} as const;

const modelConfigPayloads = createModelPayloads(CbsControlTable.MODEL_CONFIG);
const inquiryConfigPayloads = createModelPayloads(CbsControlTable.INQUIRY_CONFIG);

/**
 * The core answered that the model does not exist (an empty success, or RECORD_NOT_FOUND / 404).
 * Any other failure is a plain Error, so a designer never mistakes an outage for a new model.
 */
export class ModelConfigNotFoundError extends Error {}

/** A model's record ID: the base model of a command (`USER.MGT,V1` and `USER.MGT$X` → `USER.MGT`). */
function modelConfigRecordId(modelId: string): string {
  return modelId.split("$")[0].split(",")[0].trim().toUpperCase();
}

/** Query-key prefix shared by every record-function read of one model, for invalidation. */
export function modelConfigRecordKey(modelId: string) {
  return ["cbs", "model-config", "record", modelConfigRecordId(modelId)] as const;
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

  /**
   * A MODEL.CONFIG record read with the screen's record function: `S` reads the live model, while
   * a maintenance function (I/A/H/R/D) lets the core return the pending copy that function acts on.
   */
  modelConfigRecord: (
    modelId: string,
    recordFunction: CbsRecordFunction = CbsRecordFunction.SEE,
  ) => {
    const cleanId = modelConfigRecordId(modelId);
    return queryOptions<ModelConfigRecord>({
      queryKey: [...modelConfigRecordKey(cleanId), recordFunction] as const,
      enabled: Boolean(cleanId),
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(
          modelConfigPayloads.get(cleanId, { recordFunction }),
          { silent: true },
        );
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
    return queryOptions<FormConfigRecord>({
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
        // A layout the parser had to repair never runs: a dropped field could take wrong input.
        // Only the designer opens it, to repair and save it.
        const { model, form, isNew, repairs } = parsed.data;
        if (!isNew && (!form || repairs.length > 0)) {
          throw new Error(
            `Form "${formId}" in CONFIG.FORM could not be read. Open it in Form Design (FC) to repair it.`,
          );
        }
        if (!form?.frmElements.sections.length) {
          throw new Error(`No form "${formId}" in CONFIG.FORM. Create it in Form Design (FC).`);
        }
        return compileFormSpec(model, form);
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
