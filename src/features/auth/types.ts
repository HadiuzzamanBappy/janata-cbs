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

export interface LoginCredentials {
  username?: string;
  password?: string;
  clientId?: string;
}

export interface LoginResponse {
  message?: string;
  user?: UserDetails;
  error?: string;
  errors?: string[];
}

export interface ChangePasswordPayload {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}
