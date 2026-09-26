# 🛡️ Maker-Checker Transaction Authorization

This user guide provides step-by-step instructions for branch tellers (Makers) and supervisors (Checkers) to process high-value financial transactions requiring dual-control 4-Eye authorization.

---

## 1. Overview & Purpose

The **Maker-Checker Authorization Principle (4-Eye Verification)** ensures that high-value financial transactions, sensitive account modifications, or overdraft exceptions cannot be processed by a single individual. Every transaction above a teller's assigned financial limit must be reviewed and authorized by an independent Branch Supervisor before general ledger posting.

---

## 2. Who Can Use This Feature

- **Makers (Tellers & Officers):** Initiate transactions requiring supervisor approval.
- **Checkers (Branch Supervisors, Operation Managers, Branch Managers):** Review, authorize, or reject pending transactions.

---

## 3. Submitting Transactions for Approval (Maker Workflow)

When a teller enters a transaction exceeding their assigned limit:

1. Enter transaction details as normal on the **Transaction Entry** screen.
2. Click **Submit Transaction**.
3. The system evaluates your limit and displays a notification modal:
   > *"Transaction Amount (BDT 500,000.00) exceeds your Maker Limit (BDT 100,000.00). Sent to Supervisor Authorization Queue."*
4. The transaction status updates to **Pending Supervisor Approval**.
5. Provide the physical voucher or customer document to your Branch Supervisor for verification.

---

## 4. Authorizing Pending Transactions (Checker Workflow)

Branch Supervisors review and authorize pending queues:

1. Open the left sidebar menu and navigate to **Authorizations → Pending Authorizations Queue** (or press **`Ctrl + K`** and search for `Authorizations`).
2. The grid displays all pending items requiring your review.
3. Click on a pending transaction row to open the **Authorization Review Panel**.
4. Carefully verify the transaction parameters:
   - **Teller Name & User ID**
   - **Customer Account Number & Title**
   - **Transaction Amount & Charges**
   - **Attached Specimen Signature & Voucher Image**
5. Action Options:
   - **Click Authorize:** Transaction is immediately approved, posted to the general ledger, and finalized.
   - **Click Reject:** Prompt opens requiring **Rejection Remarks** (e.g., *Signature mismatch*, *Incorrect voucher narration*). The transaction is returned to the Maker with **Rejected** status.

---

## 5. Transaction Authorization States

| Status | Meaning | Action Needed |
| :--- | :--- | :--- |
| **Pending** | Submitted by Maker; awaiting Supervisor review. | Checker must inspect and approve or reject. |
| **Approved** | Authorized by Supervisor; posted to General Ledger. | Maker can print final customer voucher. |
| **Rejected** | Rejected by Supervisor with written comments. | Maker must review remarks and re-enter or cancel. |
| **Cancelled** | Cancelled by Maker before Supervisor review. | No further action. |

---

## 6. Common Approval Warnings & Security Guidelines

| Warning / Issue | Explanation | Action Required |
| :--- | :--- | :--- |
| **Self-Authorization Prohibited** | Supervisors cannot authorize transactions initiated by their own User ID. | A secondary supervisor or Branch Manager must authorize. |
| **Authorization Timeout** | Pending request left unapproved for over 2 hours. | Request expires; Maker must resubmit transaction voucher. |
| **Signature Mismatch Warning** | Customer signature on file differs from scanned cheque image. | Supervisor must perform physical identity check before approving. |

---

## 7. Related Tasks

- [Financial Transaction Entry](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/transaction-entry.md)
- [Customer & Account Inquiries](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/customer-inquiry.md)
- Managing User Roles & Financial Approval Limits
