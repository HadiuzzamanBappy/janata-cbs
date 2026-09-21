---
name: wire-grpc-proxy
description: Use this skill to safely connect a UI component to the Java backend via the /api/proxy endpoint, guaranteeing that no server secrets or gRPC dependencies leak to the browser.
---

# 🚀 Skill: Wire gRPC Proxy Route

Use this runbook to correctly implement data fetching and mutation between a client component and the Java gRPC backend using the BFF architecture.

## 🛑 Pre-Flight Checks
1. **Target Component**: Identify the client component that needs to fetch or submit data.
2. **Payload Target**: Identify the backend gRPC target or payload type (e.g. `ACCOUNT`, `GMC`).

## 🛠️ Execution Steps

### Step 1: Define the Zod Schema
In the relevant feature domain (e.g. `src/features/<domain>/schema.ts`), define the Zod schema for both the request payload and the expected response payload. 
Never skip validation.

### Step 2: Build the Fetch Function
Create a data-fetching utility (or a Server Action) that:
- Accepts the raw user input.
- Validates it using `ZodSchema.parse()`.
- Sends the validated payload to the Next.js Gateway via `fetch('/api/proxy', { method: 'POST', body: JSON.stringify(payload) })`.

### Step 3: Handle the Response Securely
- Parse the response from `/api/proxy` using the Response Zod schema.
- Handle any HTTP errors (e.g. `!response.ok`) gracefully and return typed error strings to the UI.

### Step 4: Wire the UI
- In the client component, wire the fetch function to the form submission or button click.
- Implement loading states (e.g., using `useTransition` or `useState`) to give visual feedback during the network request.
- Use the `toast` component to display success or error messages based on the response.
