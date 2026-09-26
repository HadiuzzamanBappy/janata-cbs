# 📝 Financial Transaction Entry & Voucher Processing

This user guide provides comprehensive operational procedures for cash tellers and banking officers to process daily customer financial transactions (Cash Deposits, Withdrawals, Transfers), manage draft vouchers, and handle form input validations.

---

## 1. Overview & Purpose

The **Transaction Entry Engine** allows authorized branch officers to record, validate, and post customer financial operations to the core ledger. The system enforces single-entry validation, daily teller cash drawer limits, and automatic transaction voucher generation.

---

## 2. Who Can Use This Feature

- **Cash Tellers & Customer Service Officers**
- **Branch Operations Officers**
- **Account Managers**

---

## 3. Prerequisites

Before posting financial transactions:
1. Ensure your daily teller session is active and opened.
2. Confirm your cash drawer balance matches your morning opening total.
3. Verify customer identification (National ID, Account Signature Card, or Biometric Match).
4. Ensure the target customer account status is **Active** (not Frozen, Dormant, or Deceased).

---

## 4. Step-by-Step Transaction Entry Procedure

Follow these exact steps to enter and post a financial voucher:

1. Open the target transaction entry screen from the sidebar menu (e.g., **Transactions → Cash Deposit Entry** or **Fund Transfer**).
2. Enter the target **Account Number** (e.g., `0014-01029384`). Press **Tab** or click **Verify Account**.
   - *System Check:* The system will display the verified Customer Name, Current Available Balance, and Account Status badge.
3. Enter the **Transaction Amount** in BDT (e.g., `50,000.00`).
4. Select the **Transaction Type** (e.g., `Cash Deposit`, `Cheque Transfer`, `RTGS Transfer`).
5. Enter a clear **Narration / Voucher Description** (e.g., *Cash deposit for October tuition fee*).
6. Review the summary breakdown:
   - **Principal Amount:** BDT 50,000.00
   - **Service Charges / Stamp Fees:** BDT 0.00
   - **Net Ledger Effect:** BDT 50,000.00 Credit
7. Click **Submit Transaction**.

---

## 5. Financial Transaction Lifecycle & Status Definitions

Every entered financial record progresses through specific transaction states:

| Status State | Description & Action Required |
| :--- | :--- |
| **Draft** | Form entries saved locally as you type. Not posted to general ledger. |
| **Pending Approval** | High-value transaction exceeding teller limit sent to Supervisor Queue for 4-Eye authorization. |
| **Completed / Posted** | Transaction authorized and posted to general ledger. Voucher printable. |
| **Rejected** | Transaction rejected by Branch Supervisor with comments. Re-entry required. |
| **Failed** | Transaction failed ledger validation (e.g., Insufficient Available Balance). |

---

## 6. Automatic Form Draft Preservation

To prevent data loss during customer interruptions:
- Any unsubmitted form entry is automatically saved as a **Draft**.
- Switching tabs or answering customer inquiries will **NOT** erase your typed values.
- Returning to the transaction tab restores your exact input state.

---

## 7. Common Validation Errors & Resolution Steps

| Validation Error Message | Root Cause | Recommended Recovery Action |
| :--- | :--- | :--- |
| **Insufficient Available Balance** | Withdrawal amount exceeds customer available balance. | Verify ledger balance or check for uncleared cheque holds. |
| **Account Status Frozen / Restrained** | Legal restraint or court freeze placed on customer account. | Refuse transaction; refer customer to Branch Manager. |
| **Teller Cash Drawer Limit Exceeded** | Cash in vault exceeds assigned teller holding limit. | Perform a Cash Transfer to Vault (`Vault Transfer`) before proceeding. |
| **Mandatory Field Missing** | Required field (e.g., Voucher Narration) left blank. | Complete all highlighted fields marked with red asterisks (`*`). |

---

## 8. Related Tasks

- [Maker-Checker Transaction Authorization](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/maker-checker-authorization.md)
- [Customer & Account Inquiries](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/customer-inquiry.md)
- Teller Cash Balancing & End-of-Day Closing
