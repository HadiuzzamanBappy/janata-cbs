import type { CbsVersionedTable } from "./types";

export type CustomerRecord = Record<string, unknown>;

/**
 * CUST_CUSTOMER Database Table (PREFIX: CUST, TABLE: CUSTOMER)
 * Stores Universal Customer Master & KYC Information.
 */
export const CUST_CUSTOMER: Record<string, CustomerRecord> = {
  CUST1001: {
    nationalId: "19852691234567890",
    dateOfBirth: "1985-06-15",
    fatherName: "MD. ABDUR RAHMAN",
    motherName: "FATEMA BEGUM",
    fullName: "MD. KAMRUL HASAN",
    gender: "MALE",
    nationality: "BANGLADESHI",
    occupation: "PRIVATE_SERVICE",
    monthlyIncome: 85000,
    presentAddress: {
      street: "House 24, Road 7, Sector 3",
      city: "Uttara, Dhaka",
      postalCode: "1230",
    },
    permanentAddress: {
      street: "Village: Rampur, Post: Sadar",
      city: "Cumilla",
      postalCode: "3500",
    },
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 10:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  CUST1002: {
    nationalId: "19902699876543210",
    dateOfBirth: "1990-11-22",
    fatherName: "LATE ENAMUL HAQUE",
    motherName: "RASHIDA AKTER",
    fullName: "NUSRAT JAHAN",
    gender: "FEMALE",
    nationality: "BANGLADESHI",
    occupation: "BUSINESS",
    monthlyIncome: 150000,
    presentAddress: {
      street: "Flat 4A, Green Garden, Dhanmondi 27",
      city: "Dhaka",
      postalCode: "1209",
    },
    permanentAddress: {
      street: "House 12, Main Road",
      city: "Sylhet",
      postalCode: "3100",
    },
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-02 11:30:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-02 11:35:00",
      recBranchCode: "JB1001",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const CUST_CUSTOMER_INAU: Record<string, CustomerRecord> = {};
export const CUST_CUSTOMER_HIS: Record<string, CustomerRecord[]> = {};
export const CUST_CUSTOMER_DEL: Record<string, CustomerRecord> = {};

export const CUST_CUSTOMER_TABLE: CbsVersionedTable<CustomerRecord> = {
  LIVE: CUST_CUSTOMER,
  INAU: CUST_CUSTOMER_INAU,
  HIS: CUST_CUSTOMER_HIS,
  DEL: CUST_CUSTOMER_DEL,
};

export const CUST_CUSTOMER_LIST: CustomerRecord[] = Object.values(CUST_CUSTOMER);
