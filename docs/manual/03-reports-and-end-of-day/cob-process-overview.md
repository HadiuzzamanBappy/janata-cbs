# 🌙 Close of Business (COB) Operational Guide

This user guide provides operational instructions for branch tellers, supervisors, and operations managers during the daily **Close of Business (COB)** automated processing phase.

---

## 1. Overview & Purpose

**Close of Business (COB)** is the mandatory daily batch processing phase performed at the end of each banking day. During COB, the core banking system calculates daily interest accruals, posts standing instruction orders, updates general ledger balance sheets, archives daily transaction logs, and advances the system **Business Date** to the next banking day.

> [!WARNING]
> **Operational Impact:** No new financial transactions can be entered or posted while COB execution is active.

---

## 2. Who Can Use / Monitor This Feature

- **Cash Tellers & Officers:** Complete mandatory pre-COB drawer closing tasks.
- **Branch Operation Managers & System Administrators:** Execute COB batch jobs and monitor stage registry status.

---

## 3. Pre-COB Teller Checklist (Mandatory Steps Before COB)

Every teller must complete these procedures before COB initiation:

1. **Authorize Pending Vouchers:** Ensure all pending transactions in your Maker queue are approved or rejected.
2. **Balance Physical Cash Drawer:** Count physical cash in your drawer and reconcile with the **Teller Cash Summary Report**.
3. **Perform Vault Transfer:** Transfer excess cash to the main vault (if drawer cash exceeds limit).
4. **Close Active Workstation Tabs:** Submit or discard all open draft forms.
5. **Sign Out Session:** Log out of your active Janata CBS Workbench session.

---

## 4. Monitoring COB Execution Status

Branch Managers monitor COB progress via the COB Registry screen:

1. Open the left sidebar menu and navigate to **System Admin → COB Registry Status** (or press **`Ctrl + K`** and search for `COB Registry`).
2. Review the 5 COB Batch Execution Stages:

| Stage Phase | Batch Description | System Activity |
| :--- | :--- | :--- |
| **Stage 1: Pre-COB Validation** | System checks for open teller drawers & unauthorized vouchers. | Blocks COB if unposted vouchers exist. |
| **Stage 2: Interest & Fee Accrual** | Calculates daily interest on savings, loans, and term deposits. | Posts automated ledger interest vouchers. |
| **Stage 3: General Ledger Balancing** | Balances branch trial balance debit and credit totals. | Reconciles general ledger balance sheets. |
| **Stage 4: Date Roll & Archival** | Advances system Business Date (e.g., `26-SEP-2026` → `27-SEP-2026`). | Archives daily transaction journals. |
| **Stage 5: System Re-Opening** | Re-enables online teller login for the new business date. | System ready for morning operations. |

---

## 5. Handling COB Warnings & Execution Failures

If a batch stage halts or reports an error during COB:

| COB Error Message | Cause | Resolution Procedure |
| :--- | :--- | :--- |
| **Stage 1 Halted: Unposted Vouchers Found** | A teller left a transaction pending in their queue. | System Administrator identifies teller ID; supervisor approves or rejects voucher. |
| **Stage 3 Halted: GL Out of Balance** | Debit/Credit discrepancy in general ledger accounts. | Branch Accountant inspects Trial Balance Exception Report; posts balancing voucher. |
| **Database Lock Timeout** | A user terminal left an active lock on a record. | Admin forcefully terminates stale session via Admin Console and resumes COB. |

---

## 6. Post-COB Morning Re-Opening Verification

When logging in the morning after COB:
1. Verify the **Business Date** displayed in the top header bar reflects the new date.
2. Generate the **Morning Opening Trial Balance Report** to confirm ledger integrity.
3. Open your daily teller cash drawer session.

---

## 7. Related Tasks

- [Generating & Printing Daily Branch Reports](file:///d:/Work/React/cbs/finx-ui/docs/manual/03-reports-and-end-of-day/printing-daily-reports.md)
- [Maker-Checker Transaction Authorization](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/maker-checker-authorization.md)
- Vault Cash Balancing & Transfer Procedures
