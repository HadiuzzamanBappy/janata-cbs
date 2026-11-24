import { composeInquiryQuery, inquiryPageSize } from "@/lib/cbs-inquiry-spec";
import { parseInquiryConfig } from "@/lib/data-parsers";
import {
  type ApiResponse,
  DEFAULT_SERVICE,
  type GrpcEnvelope,
  inquiryRunDataSchema,
  isApiSuccess,
  SERVICE_NAME_PATTERN,
} from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";

export type InquiryResolution =
  | { readonly ok: true; readonly envelope: GrpcEnvelope }
  | { readonly ok: false; readonly status: number; readonly message: string };

/** Reads the saved inquiry (`GET INQUIRY S <id>`) through the proxy's cached dispatch. */
export type InquiryDefinitionLoader = (envelope: GrpcEnvelope) => Promise<ApiResponse>;

const refuse = (status: number, message: string): InquiryResolution => ({
  ok: false,
  status,
  message,
});

/**
 * Turns the browser's INQ request (the inquiry ID in `recordId`, the operator's filters in
 * `data.queryString`) into the envelope for the core, built only from the saved inquiry: its
 * controller and service, its fixed selection, the session branch for a branch-wise inquiry
 * (`composeInquiryQuery`), and the row cap. Nothing the browser sends can pick another table,
 * drop a fixed condition or read another branch.
 */
export async function resolveInquiryEnvelope(
  request: GrpcEnvelope,
  load: InquiryDefinitionLoader,
): Promise<InquiryResolution> {
  const inquiryId = request.recordId.trim().toUpperCase();
  if (!inquiryId) return refuse(400, "Inquiry ID (recordId) is required");
  const filters = inquiryRunDataSchema.safeParse(request.data);
  if (!filters.success) {
    return refuse(400, filters.error.issues[0]?.message || "Invalid inquiry filters");
  }

  const res = await load({
    ...request,
    servicePath: DEFAULT_SERVICE,
    requestType: CbsRequestType.GET,
    controlName: CbsControlTable.INQUIRY_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: inquiryId,
    idempotencyKey: undefined,
    data: {},
  });
  if (!isApiSuccess(res) || !res.data) {
    return refuse(
      res.statusCode >= 400 ? res.statusCode : 404,
      res.message || `Inquiry "${inquiryId}" not found`,
    );
  }
  const definition = parseInquiryConfig(res.data);
  if (!definition.success) return refuse(422, `Inquiry "${inquiryId}" has an invalid definition`);

  const info = definition.data.INQInfo;
  const controller = info.controllerName.trim().toUpperCase();
  if (!controller) return refuse(422, `Inquiry "${inquiryId}" has no target controller`);
  const servicePath = info.inqServicePath.trim() || DEFAULT_SERVICE;
  if (!SERVICE_NAME_PATTERN.test(servicePath)) {
    return refuse(422, `Inquiry "${inquiryId}" has an invalid service path`);
  }

  const query = composeInquiryQuery(definition.data, filters.data.queryString, request.branchCode);
  if (!query.ok) return refuse(400, query.error);

  return {
    ok: true,
    envelope: {
      ...request,
      servicePath,
      controlName: controller,
      recordFunction: CbsRecordFunction.SEE,
      recordId: "",
      data: {
        queryString: query.queryString,
        curPage: filters.data.curPage ?? 1,
        perPage: inquiryPageSize(info),
        inqType: info.inqType,
      },
    },
  };
}
