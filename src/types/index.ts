export interface ICommand {
  command: string;
  cmdLabel?: string;
}

export interface APIResponse<T = any> {
  status: string;
  statusCode: number;
  idempotencyKey?: string;
  message: string;
  errors?: string[];
  timestamp?: string;
  data?: T;
}

export interface UserDetails {
  userId: string;
  fullName: string;
  userRole: string[];
  accessibility: string;
  branchCode: string;
  branchName: string;
  txnDate: string;
  lastTxnDate?: string;
  nextDate?: string;
  isLoggedIn: boolean;
  commandLine: boolean;
  initLogin: boolean;
  userStatus: number;
}

export interface Envelope {
  servicePath: string;
  requestType: string;
  controlName?: string;
  branchCode: string;
  recordFunction: string;
  recordId: string;
  authLevel: number;
  userId: string;
  clientId: string;
  data: Record<string, unknown>;
}
