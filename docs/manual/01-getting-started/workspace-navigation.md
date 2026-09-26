# 🖥️ Workspace & Window Navigation Guide

This user guide explains how banking officers navigate the **Janata CBS Core Banking Workbench**, manage multiple active tasks using the tabbed workspace, use dual-monitor pop-out windows, and locate banking functions quickly.

---

## 1. Overview & Purpose

The **Janata CBS Workbench** provides a modern multi-tasking workspace designed for efficient banking operations. Officers can open multiple customer inquiries, deposit transaction forms, and reporting screens simultaneously without losing active work or typed form data.

---

## 2. Who Can Use This Feature

- **All Authorized Bank Staff** (Tellers, Officers, Managers, Auditors)

---

## 3. Key Navigation Components

The workbench layout is organized into four main operational areas:

| Area | Location | Purpose |
| :--- | :--- | :--- |
| **Header Toolbar** | Top of screen | Displays current Business Date, Active Branch, User Profile, Quick Search bar (`Ctrl + K`), and Theme toggle. |
| **Navigation Sidebar** | Left side of screen | Displays hierarchical tree navigation for all authorized banking menus and operations. |
| **Workspace Tab Bar** | Below header | Displays all currently open screens and forms as active tabs. |
| **Main Content Canvas** | Center area | Displays the active banking form, inquiry table, or reporting tool. |

---

## 4. Working with the Internal Tabbed Workspace (`Panel` Mode)

By default, every screen opened from the sidebar menu or global search bar opens as a tab inside your main workbench area.

### Operational Features & Procedures:

1. **Opening a Screen:** Click any menu item in the left sidebar tree or select a result from the Global Search box (`Ctrl + K`).
2. **Switching Between Tasks:** Click on any tab header in the Workspace Tab Bar to switch between active tasks (e.g., switch from a Cash Deposit form to a Account Inquiry screen).
3. **Automatic Draft Preservation:** Data typed into an unsubmitted form is automatically preserved as a **Draft** when you switch between tabs. You can return to your form at any time without losing typed information.
4. **Closing a Tab:** Click the **`×` (Close)** icon on the right side of the tab title.
5. **Close All / Close Others:** Right-click any tab title to access shortcut options to close inactive tabs.

> [!TIP]
> **Keyboard Shortcut:** Press **`Ctrl + K`** anywhere in the workbench to open the **Global Command Search** popup and quickly launch any screen by typing its name or screen ID.

---

## 5. Using Dual-Monitor Pop-Out Windows (`Window` Mode)

For officers working with dual-monitor teller stations or performing complex cross-referencing:

1. Open the desired screen in your tabbed workspace.
2. Click the **Window Pop-Out** icon located on the top right toolbar of the active screen card.
3. The screen will detach into an independent browser popup window that can be dragged to a second monitor.
4. **Re-Focusing Windows:** If you select the same screen again from the sidebar menu, the workbench will bring the existing pop-out window to the front instead of opening duplicate windows.

---

## 6. Global Command & Screen Search (`Ctrl + K`)

The **Global Command Search** tool allows officers to find any banking operation without navigating nested sidebar menus:

1. Press **`Ctrl + K`** on your keyboard (or click the Search input in the top header bar).
2. Type the name of the function, screen title, or command code (e.g., `Deposit`, `Account Inquiry`, or `USER.CHANGE.PASS`).
3. Use the **Up/Down Arrow Keys** to highlight the desired function.
4. Press **`Enter`** to launch the screen immediately.

---

## 7. Troubleshooting & Common Questions

| Question / Issue | Explanation & Resolution |
| :--- | :--- |
| **Cannot find a specific menu item?** | Menus are filtered by your assigned role permissions (RBAC). Contact your supervisor if you require access to restricted screens. |
| **Accidentally closed a tab with unsubmitted data?** | Unsaved form entries in closed tabs are discarded. Re-open the screen and re-enter the required fields. |
| **Pop-out window blocked by browser?** | Enable pop-ups for the Janata CBS Workbench domain in your browser settings bar. |

---

## 8. Related Tasks

- [Officer Login & Password Reset](file:///d:/Work/React/cbs/finx-ui/docs/manual/01-getting-started/officer-login.md)
- Customizing Appearance & Theme Settings
- Managing User Profile & Display Preferences
