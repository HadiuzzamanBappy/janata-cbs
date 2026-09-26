# 📊 Generating & Printing Daily Branch Reports

This user guide provides operational instructions for branch officers and managers to generate, inspect, export, and print daily financial journals, teller cash sheets, and general ledger reports.

---

## 1. Overview & Purpose

The **Reporting Module** allows branch personnel to audit daily operational records, verify teller cash balances against general ledger accounts, generate compliance statements, and archive end-of-day transaction journals.

---

## 2. Who Can Use This Feature

- **Cash Tellers & Officers** (Daily Cash Sheet, Transaction Journal)
- **Branch Operation Managers & Accountants** (Trial Balance, General Ledger Summary, Overdraft Exception Reports)
- **Internal & External Auditors** (Audit Trail Reports)

---

## 3. Prerequisites

Before generating daily reports:
1. Ensure all daily financial vouchers for the targeting business date have been submitted and authorized.
2. Confirm your printer terminal is online and loaded with official bank paper (if printing physical copies).

---

## 4. Step-by-Step Report Generation Procedure

Follow these exact steps to generate any daily branch report:

1. Open the left sidebar menu and navigate to **Reports → Report Studio** (or press **`Ctrl + K`** and search for `Daily Reports`).
2. Select your target report from the Report Catalogue:
   - **Daily Teller Cash Balance Sheet**
   - **Branch Transaction Journal**
   - **Daily General Ledger Trial Balance**
   - **High-Value Transaction Exception List**
3. Set the required Filter Parameters:
   - **Business Date:** Select specific date (e.g., `2026-09-26`).
   - **Branch Code:** Select assigned branch (e.g., `0014 - Main Branch`).
   - **Teller ID / Officer ID:** (Optional filter to isolate a specific teller).
   - **Account Range / GL Code:** (Optional GL account filter).
4. Click **Generate Report**.

### Expected Result
The system compiles the report data and renders a high-resolution preview canvas displaying official bank headers, summary subtotals, itemized transactions, and balance tallies.

---

## 5. Exporting & Offline Printing Options

Once the report is displayed on screen:

- **Export to PDF:** Click **Export PDF** on the top toolbar to download an official vector PDF document suitable for electronic archiving or emailing to regional controllers.
- **Export to Excel / CSV:** Click **Export Excel** to download an editable spreadsheet for financial reconciliation and pivot analysis.
- **Print Physical Copy:** Click **Print** to send the report directly to your assigned network printer.

---

## 6. Daily Reports Summary Catalogue

| Report Title | Frequency | Primary User | Operational Purpose |
| :--- | :--- | :--- | :--- |
| **Teller Cash Summary** | Daily (End of Shift) | Tellers | Reconciles physical cash in teller drawer with posted cash vouchers. |
| **Branch Transaction Journal** | Daily (End of Day) | Operations Manager | Itemized chronological audit trail of all posted debit/credit vouchers. |
| **Branch Trial Balance** | Daily / Monthly | Branch Accountant | Verifies general ledger debit/credit balance equality before COB. |
| **Exceptions & Overdraft List** | Daily Morning | Branch Manager | Highlights unauthorized overdrafts and uncollected charge exceptions. |

---

## 7. Troubleshooting & Common Errors

| Error / Issue | Cause | Recovery Action |
| :--- | :--- | :--- |
| **No Records for Selected Date** | No financial vouchers posted on the selected date or date range invalid. | Verify selected business date and ensure vouchers were authorized. |
| **Report Generation Timeout** | Date range too large (e.g., full year query during peak hours). | Narrow date filter to single day or weekly range. |
| **Export Button Disabled** | Report still rendering or user lacks report export privilege. | Wait for completion spinner to stop; contact supervisor for export role. |

---

## 8. Related Tasks

- [Close of Business (COB) Operational Overview](file:///d:/Work/React/cbs/finx-ui/docs/manual/03-reports-and-end-of-day/cob-process-overview.md)
- [Financial Transaction Entry](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/transaction-entry.md)
- Teller Cash Balancing & Vault Transfer Procedure
