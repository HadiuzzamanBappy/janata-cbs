import { FOUR_EYES_REASON, isAuthorizeRequest, isRecordMaker } from "@/lib/cbs-access";
import { extractModelConfigRecord, extractRecordInputter } from "@/lib/data-parsers";
import {
  type ApiResponse,
  CBS_API_STATUS,
  DEFAULT_SERVICE,
  type GrpcEnvelope,
  isApiSuccess,
  type ModelConfigRecord,
  savedModelIssues,
} from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";

/** A refused request: the HTTP status, the message, and every issue found. */
export interface GuardRefusal {
  readonly status: number;
  readonly message: string;
  readonly details?: string[];
}

/** Reads one stored record through the proxy's dispatch, decoded and never cached. */
export type StoredRecordLoader = (envelope: GrpcEnvelope) => Promise<ApiResponse>;

/** Authorize, Delete and Reverse act on the stored record and carry no definition. */
const NO_DEFINITION_FUNCTIONS: ReadonlySet<string> = new Set([
  CbsRecordFunction.AUTHORIZE,
  CbsRecordFunction.DELETE,
  CbsRecordFunction.REVERSE,
]);

export function actsOnStoredRecord(recordFunction?: string | null): boolean {
  return NO_DEFINITION_FUNCTIONS.has((recordFunction ?? "").trim().toUpperCase());
}

/** The same record, read as `GET` with `recordFunction` (no key, no data). */
const readOf = (request: GrpcEnvelope, recordFunction: CbsRecordFunction): GrpcEnvelope => ({
  ...request,
  requestType: CbsRequestType.GET,
  recordFunction,
  idempotencyKey: undefined,
  data: {},
});

const isNotFound = (res: ApiResponse): boolean =>
  res.status === CBS_API_STATUS.RECORD_NOT_FOUND || res.statusCode === 404;

/**
 * Four-Eyes, enforced here and not only in the screen: an authorize is refused when the session
 * user is the pending record's maker. It fails closed: when the pending record can't be read, or
 * names no maker, nobody can authorize it.
 */
export async function verifyFourEyes(
  request: GrpcEnvelope,
  load: StoredRecordLoader,
): Promise<GuardRefusal | null> {
  if (!isAuthorizeRequest(request.requestType, request.recordFunction)) return null;

  const res = await load(readOf(request, CbsRecordFunction.AUTHORIZE));
  if (!isApiSuccess(res) || !res.data) {
    return {
      status: isNotFound(res) ? 404 : 503,
      message: `Cannot authorize #${request.recordId}: the pending record could not be loaded to check its maker.`,
    };
  }
  const inputter = extractRecordInputter(res.data);
  if (!inputter) {
    return {
      status: 409,
      message: `Cannot authorize #${request.recordId}: the pending record names no maker.`,
    };
  }
  if (isRecordMaker(request.userId, inputter)) {
    return { status: 403, message: FOUR_EYES_REASON };
  }
  return null;
}

/**
 * A save to MODEL.CONFIG must keep the live model's table and saved columns (`savedModelIssues`).
 * A model the core doesn't have yet is new and has nothing to keep; any other read failure
 * refuses the save, because the rules couldn't be checked.
 */
export async function verifySavedModel(
  request: GrpcEnvelope,
  load: StoredRecordLoader,
): Promise<GuardRefusal | null> {
  if (
    request.requestType !== CbsRequestType.PUT ||
    request.controlName.trim().toUpperCase() !== CbsControlTable.MODEL_CONFIG ||
    actsOnStoredRecord(request.recordFunction)
  ) {
    return null;
  }

  const res = await load({
    ...readOf(request, CbsRecordFunction.SEE),
    servicePath: DEFAULT_SERVICE,
  });
  if (!isApiSuccess(res)) {
    if (isNotFound(res)) return null;
    return {
      status: 503,
      message: `Cannot save #${request.recordId}: the saved model could not be loaded to check its columns.`,
    };
  }
  const saved = extractModelConfigRecord(res.data) as ModelConfigRecord | null;
  if (!saved?.TABLENAME) return null;

  const issues = savedModelIssues(request.data as ModelConfigRecord, saved);
  if (issues.length === 0) return null;
  return {
    status: 409,
    message: issues[0].message,
    details: issues.map((i) => i.message),
  };
}

/** Audit keys a record carries; the core reads its own names as well as the client's. */
const AUDIT_BLOCK_KEYS = ["auditData", "auditFields"] as const;

/** The only audit field a client may send: the version it edited, for the core's concurrency check. */
const CLIENT_AUDIT_FIELDS: ReadonlySet<string> = new Set(["recCurrNumber"]);

/**
 * The record a mutation forwards, without the audit fields the core stamps itself: maker,
 * authorizer, their times, status and branch come from the session and the core, never from the
 * browser. Otherwise a maker could name someone else as inputter and pass Four-Eyes on their own
 * record. Only `recCurrNumber` is kept; an audit block left empty is removed.
 */
export function withoutClientAudit(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!data || !AUDIT_BLOCK_KEYS.some((key) => key in data)) return data;
  const clean: Record<string, unknown> = { ...data };
  for (const key of AUDIT_BLOCK_KEYS) {
    const block = clean[key];
    delete clean[key];
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    const kept = Object.fromEntries(
      Object.entries(block).filter(([field]) => CLIENT_AUDIT_FIELDS.has(field)),
    );
    if (Object.keys(kept).length > 0) clean[key] = kept;
  }
  return clean;
}
