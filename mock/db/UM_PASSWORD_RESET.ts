import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

export interface PasswordResetItem {
  SN?: string;
  userId: string;
  resetPassword?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  userType?: string;
}

/**
 * UmPasswordResetRecord: The canonical database table schema for UM_PASSWORD_RESET (matching SC_MODEL_CONFIG PASSWORD.RESET).
 */
export interface UmPasswordResetRecord {
  userId?: string; // Convenience root accessor for tabular inquiries
  passReset: PasswordResetItem[];
  auditData?: AuditData;
}

/**
 * UM_PASSWORD_RESET Table Master (PREFIX: UM, TABLE: PASSWORD_RESET)
 * Live authorized password reset logs.
 */
export const UM_PASSWORD_RESET: Record<string, UmPasswordResetRecord> = {
  PR00001: {
    userId: "ZZ019823",
    passReset: [
      {
        SN: "1_1",
        userId: "ZZ019823",
        resetPassword: "InitialPassword@2026",
        dateOfBirth: "1988-04-12",
        phone: "01711223344",
        email: "tanvir.ahmed@janatabank.gov.bd",
        userType: "EMP",
      },
    ],
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-11-03 06:26:28",
      recAuthorizer: "IA0245820",
      recAuthTime: "2026-11-03 06:26:46",
      recBranchCode: "JB9999",
    },
  },
  PR00002: {
    userId: "ZZ023451",
    passReset: [
      {
        SN: "1_1",
        userId: "ZZ023451",
        resetPassword: "WelcomeJanata#2026",
        dateOfBirth: "1994-09-25",
        phone: "01819556677",
        email: "nusrat.jahan@janatabank.gov.bd",
        userType: "EMP",
      },
    ],
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-11-03 08:15:10",
      recAuthorizer: "IA0245820",
      recAuthTime: "2026-11-03 08:20:00",
      recBranchCode: "JB9999",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const UM_PASSWORD_RESET_INAU: Record<string, UmPasswordResetRecord> = {
  PR00003: {
    userId: "ZZ031122",
    passReset: [
      {
        SN: "1_1",
        userId: "ZZ031122",
        resetPassword: "TempPassword!2026",
        dateOfBirth: "1991-11-18",
        phone: "01912345678",
        email: "kamrul.hasan@janatabank.gov.bd",
        userType: "EMP",
      },
    ],
    auditData: {
      recStatus: "INA",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-11-03 10:20:14",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB9999",
    },
  },
  PR00004: {
    userId: "ZZ044556",
    passReset: [
      {
        SN: "1_1",
        userId: "ZZ044556",
        resetPassword: "ResetSecure@2026",
        dateOfBirth: "1985-07-03",
        phone: "01719876543",
        email: "shahin.alam@janatabank.gov.bd",
        userType: "EMP",
      },
    ],
    auditData: {
      recStatus: "INA",
      recCurrNumber: 1,
      recInputter: "IA0245820",
      recInputTime: "2026-11-03 11:45:00",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB9999",
    },
  },
};

export const UM_PASSWORD_RESET_HIS: Record<string, UmPasswordResetRecord[]> = {};
export const UM_PASSWORD_RESET_DEL: Record<string, UmPasswordResetRecord> = {};

export const UM_PASSWORD_RESET_TABLE: CbsVersionedTable<UmPasswordResetRecord> = {
  LIVE: UM_PASSWORD_RESET,
  INAU: UM_PASSWORD_RESET_INAU,
  HIS: UM_PASSWORD_RESET_HIS,
  DEL: UM_PASSWORD_RESET_DEL,
};

export const UM_PASSWORD_RESET_LIST: UmPasswordResetRecord[] = Object.values(UM_PASSWORD_RESET);
