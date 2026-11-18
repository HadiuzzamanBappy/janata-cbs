# 📘 Janata CBS Workbench — Officer & Teller Manual

## 1. Overview & Purpose

The Janata CBS Workbench is where you do your daily banking work: opening accounts, entering transactions, checking records and approving the work of colleagues. This page explains how to sign on, find a screen, work with a record and keep your session safe.

## 2. Who Can Use This Feature

Every officer, teller, branch manager and administrator with a sign-on name.

What you can do on each screen depends on the rights your administrator gives you:

| Right            | Lets you                                       |
| ---------------- | ---------------------------------------------- |
| See / View       | Open and read a record                         |
| Insert / Update  | Create a new record or change an existing one  |
| Delete           | Delete a record that has not been approved yet |
| Authorize        | Approve a colleague's record                   |
| Reverse          | Reverse an approved transaction                |
| Hold / Park      | Save an unfinished record to complete later    |
| List / Directory | Browse lists of records                        |

If a button is greyed out, hold the mouse over it to see why.

## 3. Prerequisites

- Your **sign-on name** and **password** from your branch system administrator.
- A supported web browser. Use **one browser tab** for the Workbench (see section 5).

## 4. Step-by-Step Procedure & Expected Results

### 4.1 Sign on

1. Open the Workbench address given by your branch.
2. Enter your **Sign-on Name** and **Password**, then select **Sign on**.
3. **Expected result:** the Workbench opens with the menu on the left.

**First sign-on:** you'll see **Action Required** and must set a new password before you continue. Enter your **Current Password**, a **New Password** and **Confirm New Password**, then select **Update Password**. The new password must have:

- at least 8 characters
- one uppercase letter (A–Z) and one lowercase letter (a–z)
- one number (0–9)
- one special character (for example `!@#$%`)

If you're on someone else's sign-on, select **Sign in with a different account**.

### 4.2 Find and open a screen

Use either of these:

- **Menu:** select the screen in the menu on the left.
- **Search:** press **Ctrl+K**, type the screen code or part of its name (for example `ACCOUNT`), and press **Enter**.

You can also type a screen code with an action and a record number. For example, `ACCOUNT I 1001` opens account 1001 for editing.

**Expected result:** the screen opens as a new tab at the top of the Workbench.

### 4.3 Work with a record

1. Type the record number in the **Record ID...** box, or select **Create New Record** (**F2**) to start a new one.
2. Choose **Edit Record** to change it, or **View Details** to read it only.
3. Fill in the fields, then use the buttons at the top of the screen. The buttons are icons; hold the mouse over one to see its name.

| Button                     | Key | What it does                                   |
| -------------------------- | --- | ---------------------------------------------- |
| Validate Rules & Integrity | F7  | Checks the record for errors without saving it |
| Save / Commit Record       | F5  | Saves the record and sends it for approval     |
| Hold Draft                 | F6  | Saves an unfinished record to complete later   |
| Delete / Reverse Record    | F10 | Deletes an unapproved record                   |
| Authorize Record           | F8  | Approves a colleague's record                  |
| —                          | Esc | Returns to the record search                   |

**Expected result:** after **Save / Commit Record**, the record's status becomes **Pending Approval** until a colleague with the Authorize right approves it. It then becomes **Authorized**.

| Status           | Meaning                                         |
| ---------------- | ----------------------------------------------- |
| New Draft        | Started but not yet saved                       |
| Held             | Saved as unfinished                             |
| Pending Approval | Saved and waiting for a colleague to approve it |
| Authorized       | Approved and live                               |
| Reversed         | An approved transaction that has been reversed  |
| Deleted          | An unapproved record that was deleted           |

### 4.4 Work with tabs and windows

Right-click a tab at the top of the Workbench to:

- **Duplicate Tab** (Ctrl+D)
- **Pop Out** (open the screen in its own window)
- **Copy Screen Code**
- **Close Tab** (Ctrl+W), **Close Others** or **Close to the Right**

In a popped-out window, select the **Back to tab bar** button (the arrow at the top right) to return the screen to the main Workbench. Anything you have typed comes back with it.

### 4.5 Change branch, settings or sign out

- **Branch:** use the branch selector in the menu and type in **Search branch...** to find a branch.
- **Settings:** select your name at the bottom of the menu to open **User Profile**, **Security & Password**, **Appearance** or **Deactivate**.
- **Sign out:** select **Sign Out** at the bottom of the menu. Always sign out before you leave your desk.

## 5. Troubleshooting & Validation Errors

| You see                                                                              | What it means                                                                       | What to do                                                                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction.** | You entered or changed this record, so you can't approve it.                        | Ask a colleague with the Authorize right to approve it.                                         |
| A greyed-out button                                                                  | You don't have the right for that action, or the record's status doesn't allow it.  | Hold the mouse over the button to see the reason. Ask your administrator if you need the right. |
| **Inactivity Timeout Warning** with a countdown                                      | You have been inactive. You'll be signed out when the 60-second countdown ends.     | Select **Stay Logged In** to continue.                                                          |
| **Active in Another Tab**                                                            | The Workbench is open in another browser tab. Only one tab may be active at a time. | Select **Take Over Session Here** to work in this tab. Your unsaved work in this tab is kept.   |
| **Session Inactive** in a popped-out window                                          | Your session ended while the window was open.                                       | Sign on again in your main Workbench tab, then select **Check Session & Refresh**.              |
| **Invalid command syntax.** in the search box                                        | The screen code was typed incorrectly.                                              | Check the code and try again, or search by the screen's name.                                   |

## 6. Related Tasks

- Changing your password at any time: **Settings → Security & Password**.
- Getting a new right or a new sign-on name: contact your branch system administrator.
