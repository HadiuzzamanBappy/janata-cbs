export interface MockProxyResult {
  status: string;
  statusCode: number;
  message: string;
  data: unknown;
  timestamp: string;
}

export interface OperationContext {
  requestType: string;
  controlName: string;
  recordId: string;
  data?: Record<string, unknown>;
  idempotencyKey?: string;
}
