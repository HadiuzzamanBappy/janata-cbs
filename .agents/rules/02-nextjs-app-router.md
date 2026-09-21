# 02: Next.js App Router Constraints

- **Server-First Default**: All components MUST be React Server Components by default to maximize performance and security.
- **Client Boundary Minimization**: Use the `"use client"` directive ONLY at the absolute edges of the component tree where interactive state (`useState`) or browser APIs are strictly required.
- **Data Mutation**: ALL data mutations MUST be handled via Server Actions or dedicated Route Handlers (`/api/proxy`). Do not fetch directly from the client.
