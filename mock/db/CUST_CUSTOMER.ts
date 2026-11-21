import type { CbsVersionedTable } from "./types";

export type CustomerRecord = Record<string, unknown>;

/**
 * CUST_CUSTOMER Database Table (PREFIX: CUST, TABLE: CUSTOMER)
 * Stores Universal Customer Master & KYC Information.
 */
export const CUST_CUSTOMER: Record<string, CustomerRecord> = {
  CUST1001: {
    nationalId: "19852691234567890",
    fullName: "MD. KAMRUL HASAN",
    dateOfBirth: "1985-06-15",
    gender: "M",
    fatherName: "MD. ABDUR RAHMAN",
    motherName: "FATEMA BEGUM",
    nationality: "BANGLADESHI",
    occupation: "PRIVATE_SERVICE",
    monthlyIncome: 85000,
    mobileNumber: "01711223344",
    email: "kamrul.hasan@gmail.com",
    street: "House 24, Road 7, Sector 3",
    city: "Uttara, Dhaka",
    postalCode: "1230",
    kycStatus: "VERIFIED",
    branchCode: "JB1001",
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
      recCurrNumber: 2,
      recInputter: "SYSADMIN",
      recInputTime: "2026-06-15 10:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-06-15 10:05:00",
      recBranchCode: "JB1001",
    },
  },
  CUST1002: {
    nationalId: "19902699876543210",
    fullName: "NUSRAT JAHAN",
    dateOfBirth: "1990-11-22",
    gender: "F",
    fatherName: "LATE ENAMUL HAQUE",
    motherName: "RASHIDA AKTER",
    nationality: "BANGLADESHI",
    occupation: "BUSINESS",
    monthlyIncome: 150000,
    mobileNumber: "01811998877",
    email: "nusrat.jahan@tradecorp.com.bd",
    street: "Flat 4A, Green Garden, Dhanmondi 27",
    city: "Dhaka",
    postalCode: "1209",
    kycStatus: "VERIFIED",
    branchCode: "JB1001",
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

export const CUST_CUSTOMER_INAU: Record<string, CustomerRecord> = {
  CUST1003: {
    nationalId: "19952695555543210",
    fullName: "TASNIM AHMED",
    dateOfBirth: "1995-04-12",
    gender: "M",
    fatherName: "FARUK AHMED",
    motherName: "SALMA BEGUM",
    nationality: "BANGLADESHI",
    occupation: "STUDENT",
    monthlyIncome: 25000,
    mobileNumber: "01755443322",
    email: "tasnim.ahmed@gmail.com",
    street: "House 12, Road 4, Banani",
    city: "Dhaka",
    postalCode: "1213",
    kycStatus: "PENDING",
    branchCode: "JB1001",
    presentAddress: {
      street: "House 12, Road 4, Banani",
      city: "Dhaka",
      postalCode: "1213",
    },
    permanentAddress: {
      street: "House 12, Road 4, Banani",
      city: "Dhaka",
      postalCode: "1213",
    },
    auditData: {
      recStatus: "UA",
      recCurrNumber: 1,
      recInputter: "ZZ_MAKER",
      recInputTime: "2026-11-15 13:45:00",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB1001",
    },
  },
};
export const CUST_CUSTOMER_HIS: Record<string, CustomerRecord[]> = {
  CUST1001: [
    {
      nationalId: "19882692415000123",
      fullName: "MD. KAMRUL HASAN",
      dateOfBirth: "1988-06-15",
      gender: "M",
      fatherName: "MD. ABDUR RAHMAN",
      motherName: "FATEMA BEGUM",
      nationality: "BANGLADESHI",
      occupation: "PRIVATE_SERVICE",
      monthlyIncome: 75000,
      mobileNumber: "01711223344",
      email: "kamrul.hasan@gmail.com",
      street: "Road 10, House 20",
      city: "Dhaka",
      postalCode: "1212",
      kycStatus: "VERIFIED",
      branchCode: "JB1001",
      auditData: {
        recStatus: "AU",
        recCurrNumber: 1,
        recInputter: "SYSADMIN",
        recInputTime: "2026-01-01 10:00:00",
        recAuthorizer: "SUPV01",
        recAuthTime: "2026-01-01 10:05:00",
        recBranchCode: "JB1001",
      },
    },
  ],
};

export const CUST_CUSTOMER_DEL: Record<string, CustomerRecord> = {
  CUST1099: {
    nationalId: "19902691111122223",
    fullName: "REVERSED PROSPECT RECORD",
    dateOfBirth: "1990-01-01",
    gender: "M",
    fatherName: "PROSPECT FATHER",
    motherName: "PROSPECT MOTHER",
    nationality: "BANGLADESHI",
    occupation: "BUSINESS",
    monthlyIncome: 50000,
    mobileNumber: "01799887766",
    email: "reversed.prospect@test.com",
    street: "Dhanmondi 27",
    city: "Dhaka",
    postalCode: "1209",
    kycStatus: "REJECTED",
    branchCode: "JB1001",
    auditData: {
      recStatus: "DEL",
      recCurrNumber: 1,
      recInputter: "ZZ_MAKER",
      recInputTime: "2024-05-10 14:00:00",
      recAuthorizer: "CHECKER01",
      recAuthTime: "2024-05-10 14:20:00",
      recBranchCode: "JB1001",
    },
  },
};

export const CUST_CUSTOMER_TABLE: CbsVersionedTable<CustomerRecord> = {
  LIVE: CUST_CUSTOMER,
  INAU: CUST_CUSTOMER_INAU,
  HIS: CUST_CUSTOMER_HIS,
  DEL: CUST_CUSTOMER_DEL,
};
