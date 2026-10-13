# 02: Modern Next.js (App Router) & React 19 Standards

## 1. Asynchronous Dynamic APIs (Next.js Breaking Changes)
Next.js dynamically-evaluated parameters and request contexts are asynchronous Promises:
- **Cookies & Headers:** ALWAYS `await` them:
  ```ts
  // CORRECT
  const cookieStore = await cookies();
  const token = cookieStore.get("cbs_token")?.value;

  // INCORRECT - will trigger fatal runtime deprecation/error
  const token = cookies().get("cbs_token")?.value;
  ```
- **Page Props (`params` & `searchParams`):**
  ```ts
  // CORRECT
  export default async function Page(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
  }
  ```

## 2. React 19 JSX & Script Rules
- **No Raw Script Tags in Components:** React 19 prohibits inserting plain string children inside `<script>` elements during client hydration.
  ```tsx
  // CORRECT
  <script
    dangerouslySetInnerHTML={{
      __html: `try{var s=localStorage.getItem('theme');...}catch(e){}`,
    }}
  />

  // INCORRECT - will throw [browser] Encountered a script tag while rendering React component
  <script>{`try{...}`}</script>
  ```

## 3. Server Components by Default & Boundary Pruning
- Default to React Server Components (RSC) for all layouts, root wrappers, and data-fetching pages.
- Add `"use client"` only at leaf components requiring browser APIs, event listeners, or Zustand store hooks.
- **Root Provider Wrapping**: Any component using Zustand store hooks (`useSessionStore`, `useWorkbenchStore`, `useAlertStore`) must be contained inside `<CbsAppStoreProvider>`. Root layouts must mount `<CbsAppStoreProvider>` around all application children.
