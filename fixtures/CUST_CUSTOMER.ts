/**
 * CUST_CUSTOMER Database Table (PREFIX: CUST, TABLE: CUSTOMER)
 * Stores Universal Customer Master & KYC Information.
 */
export const CUST_CUSTOMER_LIVE: Record<string, Record<string, unknown>> = {
  CUST1001: {
    recordId: "CUST1001",
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
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 10:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  CUST1002: {
    recordId: "CUST1002",
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
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-02 11:30:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-02 11:35:00",
      recBranchCode: "JB1001",
    },
  },
};

export const CUST_CUSTOMER_TABLE = CUST_CUSTOMER_LIVE;
export const CUST_CUSTOMER_LIST = Object.values(CUST_CUSTOMER_LIVE);

export function getCustomerRecord(recordId: string): Record<string, unknown> | null {
  const cleanId = recordId.trim().toUpperCase();
  return CUST_CUSTOMER_LIVE[cleanId] ?? null;
}
