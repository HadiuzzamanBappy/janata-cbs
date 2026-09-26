# 🛠️ System Configuration Domain Architecture

## 1. Executive Summary & Purpose
This document specifies the architecture, visual form designer, database model configuration, and menu tree designer of the System Configuration domain in `finx-ui` located at [src/features/system-config/](file:///d:/Work/React/cbs/finx-ui/src/features/system-config).

System Configuration is an administrative module used by core banking system administrators to design form layouts, configure database model schemas, manage navigation menu trees, and configure close-of-business (COB) registries.

---

## 2. Key Administrative Bespoke Screen Overrides

| Component | Bespoke Override Command | Description |
| :--- | :--- | :--- |
| **`SC.FORM.BUILDER.tsx`** | `SC.FORM.BUILDER` | Visual drag-and-drop form builder for creating GMC schemas. |
| **`SC.MODEL.CONFIG.tsx`** | `SC.MODEL.CONFIG` | Database model field configuration editor. |
| **`SC.MENU.DESIGN.tsx`** | `SC.MENU.DESIGN` | Drag-and-drop navigation menu tree designer. |
| **`SC.HELP.TEXT.tsx`** | `SC.HELP.TEXT` | Contextual help text and field tooltip manager. |
| **`SC.COB.REGISTRY.tsx`** | `SC.COB.REGISTRY` | Close-of-business process registry editor. |

---

## 3. Security & Admin Authorization

- **Restricted Access:** All screens in `src/features/system-config/` require administrator session privileges validated at the BFF layer (`/api/proxy`).
- **Audit Logging:** Any modification to GMC schemas or menu trees triggers an audit log event sent to the backend.

---

## 4. Verification Criteria

To verify system config tools:
```bash
pnpm typecheck
pnpm lint
```

---

## 5. Affected Documentation Updates
When modifying system configuration screens, update:
- [docs/03-domain-features/system-config.md](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/system-config.md)
- [docs/02-core-engine/gmc-schema-spec.md](file:///d:/Work/React/cbs/finx-ui/docs/02-core-engine/gmc-schema-spec.md)
