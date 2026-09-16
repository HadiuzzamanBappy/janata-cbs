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
 * Offline development mock branch directory.
 */
export const STATIC_BRANCHES: BranchMock[] = [
  {
    recordId: "JB9999",
    branchTitle: "Head Office Main",
    branchAddress: "Dhaka Central Financial District",
    branchOpenDate: "2010-01-01",
    currTxnDate: "2026-09-16",
    divCode: "DIV01",
    areaCode: "AREA01",
  },
  {
    recordId: "JB0001",
    branchTitle: "Gulshan Corporate Branch",
    branchAddress: "Gulshan-2 Circle, Dhaka",
    branchOpenDate: "2012-05-15",
    currTxnDate: "2026-09-16",
    divCode: "DIV01",
    areaCode: "AREA02",
  },
  {
    recordId: "JB0002",
    branchTitle: "Motijheel Commercial Branch",
    branchAddress: "Dilkusha C/A, Dhaka",
    branchOpenDate: "2011-03-20",
    currTxnDate: "2026-09-16",
    divCode: "DIV01",
    areaCode: "AREA03",
  },
  {
    recordId: "JB0003",
    branchTitle: "Chittagong Agrabad Branch",
    branchAddress: "Agrabad Commercial Area, Chattogram",
    branchOpenDate: "2015-08-10",
    currTxnDate: "2026-09-16",
    divCode: "DIV02",
    areaCode: "AREA10",
  },
];
