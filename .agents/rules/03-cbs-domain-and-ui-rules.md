# 03: Core Banking Domain & Layout Rules

- **Workspace Navigation Ban**: NEVER use Next.js `<Link>` or `router.push()` to open banking screens. All screen navigation MUST trigger your custom workspace dispatcher (e.g., spawning a tab or popup window) to prevent destroying active sessions.
- **Multi-Instance Execution**: Every execution click MUST spawn a new independent workspace tab or window. NEVER jump to or overwrite an existing open tab.
- **High-Density UI (Compact)**: Banking forms require massive vertical space. Default to compact UI elements (`size="sm"`, reduced padding) rather than standard airy web layouts.
- **Unconstrained Screen Space**: Workspace screen containers MUST use `w-full flex-1` with no `max-w-*` constraints to stretch across wide monitors.
- **Universal Tab Badges**: Every `<TabBar />` tab MUST display its 1-based index position (`1`, `2`, `3`) as a left-side badge.
- **Clean Title Strings**: Tab title properties MUST remain pure screen titles (e.g. `General Inquiry`). NEVER embed count suffixes directly into the title string.
- **Destructive Action Confirmations**: Mass workspace actions (e.g., *Close All Tabs*) MUST prompt a blocking confirmation `<Dialog />`.
- **Off-Canvas Sidebar**: The application sidebar MUST use `collapsible="offcanvas"` (leaving no icon rail behind).
- **Headerless Workspace Screens**: Workspace screen windows MUST NOT contain redundant window card headers (`<CardHeader>`).
