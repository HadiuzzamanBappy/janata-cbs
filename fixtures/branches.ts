export interface BranchMock {
  recordId: string;
  branchTitle: string;
  branchAddress: string;
  branchOpenDate: string;
  currTxnDate: string;
  divCode: string;
  areaCode: string;
}

/**
 * Offline development mock branch directory aligned with CBS live database (.response/branch.json).
 */
export const STATIC_BRANCHES: BranchMock[] = [
  {
    recordId: "JB9999",
    branchTitle: "CENTRAL OFFICE, HO, DHAKA",
    branchAddress: "Motijheel C/A, Dhaka",
    branchOpenDate: "2010-01-01",
    currTxnDate: "2026-01-07",
    divCode: "7001",
    areaCode: "5035",
  },
  {
    recordId: "JB0001",
    branchTitle: "IMAMGONJ CORPORATE",
    branchAddress: "Imamgonj, Dhaka",
    branchOpenDate: "20250101",
    currTxnDate: "2026-01-07",
    divCode: "7001",
    areaCode: "5035",
  },
  {
    recordId: "JB0002",
    branchTitle: "LALDIGHI EAST CORP.",
    branchAddress: "Laldighi East, Chattogram",
    branchOpenDate: "20250101",
    currTxnDate: "2026-01-07",
    divCode: "7002",
    areaCode: "5040",
  },
  {
    recordId: "JB1001",
    branchTitle: "MOTIJHEEL CORPORATE BRANCH",
    branchAddress: "Motijheel, Dhaka",
    branchOpenDate: "2011-03-20",
    currTxnDate: "2026-01-07",
    divCode: "7001",
    areaCode: "5035",
  },
  {
    recordId: "JB1002",
    branchTitle: "GULSHAN CORPORATE BRANCH",
    branchAddress: "Gulshan-2 Circle, Dhaka",
    branchOpenDate: "2012-05-15",
    currTxnDate: "2026-01-07",
    divCode: "7001",
    areaCode: "5036",
  },
];
