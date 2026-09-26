# ❓ Common System Errors & Operational FAQ Guide

This user guide provides a reference matrix for resolving common system error messages, session notifications, validation warnings, and operational FAQs encountered while working in the Janata CBS Core Banking Workbench.

---

## 1. Overview & Purpose

The **Troubleshooting & FAQ Guide** assists branch officers in diagnosing system notifications quickly, understanding whether an error requires supervisor intervention, and performing safe self-service recovery steps without disrupting branch operations.

---

## 2. Who Can Use This Guide

- **All Authorized Workbench Users** (Tellers, Officers, Supervisors, Managers)

---

## 3. Comprehensive Error Resolution Matrix

| Error Notification Message | Error Type | Likely Root Cause | Self-Service Recovery Procedure |
| :--- | :--- | :--- | :--- |
| **"Session Expired Due to Inactivity"** | Session | Terminal left idle for over 15 minutes. | Click **Re-Authenticate**, re-enter your password, and resume work. Active form drafts will be preserved. |
| **"Account Locked (3 Failed Attempts)"** | Security | Multiple incorrect password attempts entered. | Contact your Branch IT Administrator to unlock your User ID profile. |
| **"Unauthorized Branch Access"** | Permission | Selected branch code does not match your assigned profile. | Click your User Avatar in the header bar and select your assigned home branch code. |
| **"Transaction Exceeds Maker Limit"** | Approval | Transaction amount exceeds your assigned teller limit. | Click **Submit for Approval** to send the voucher to your Supervisor's 4-Eye queue. |
| **"Insufficient Available Balance"** | Ledger | Customer available balance is less than withdrawal amount. | Verify customer available balance in Inquiry screen or check for uncollected cheque holds. |
| **"Account Status Restrained / Frozen"** | Regulatory | Legal restraint or regulatory hold placed on customer account. | Refuse transaction; refer customer to Branch Operation Manager. |
| **"Pop-Up Window Blocked"** | Browser | Browser security blocked the pop-out window. | Click the browser address bar icon and select *"Always allow pop-ups for Janata CBS domain"*. |
| **"Core System Temporarily Unavailable"** | Network | Network disruption between branch terminal and host server. | Check network cable; wait 2 minutes and retry. If persistent, escalate to IT Helpdesk. |

---

## 4. Frequently Asked Questions (FAQ)

### Q1: Will I lose my typed data if my session times out while I am serving a customer?
**Answer:** No. The workbench automatically saves your unsubmitted form entries as **Drafts**. When you log back in or re-authenticate your session, your active tabs and typed form data are restored automatically.

### Q2: Why is a specific menu option missing from my left navigation sidebar?
**Answer:** Sidebar menus are dynamically filtered based on your assigned Role-Based Access Control (RBAC) permissions. If a menu option is missing, your User ID is not assigned the required role permission. Request permission elevation from your Branch Manager.

### Q3: What should I do if a printed report or voucher cuts off text on the right side?
**Answer:** Ensure your printer paper size is set to **A4 Standard (8.27 × 11.69 inches)** and printer scale is set to **100% Fit to Printable Area** in the browser print dialog.

### Q4: How do I pop out a form to a second monitor screen?
**Answer:** Open the desired screen tab, then click the **Pop-Out Window** icon located on the top right toolbar of the card container.

---

## 5. Escalation & IT Support Guidelines

If an issue cannot be resolved using the self-service steps above:

1. Note down the exact **Error Code** and **Message Text** displayed on screen.
2. Note your **User ID**, **Branch Code**, and the active **Screen Title / ID** (e.g., `SC.CHANGE.PASS` or `INQ`).
3. Contact your **Branch IT Administrator** or call the **Central CBS Support Helpdesk** at Extension `4444`.

> [!CAUTION]
> **Security Reminder:** IT Support staff will never ask for your password, PIN, or security credentials. Do not share credentials under any circumstances.

---

## 6. Related Tasks

- [Officer Login & Password Reset](file:///d:/Work/React/cbs/finx-ui/docs/manual/01-getting-started/officer-login.md)
- [Workspace Navigation Guide](file:///d:/Work/React/cbs/finx-ui/docs/manual/01-getting-started/workspace-navigation.md)
- [Financial Transaction Entry](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/transaction-entry.md)
- [Maker-Checker Transaction Authorization](file:///d:/Work/React/cbs/finx-ui/docs/manual/02-daily-teller-operations/maker-checker-authorization.md)
