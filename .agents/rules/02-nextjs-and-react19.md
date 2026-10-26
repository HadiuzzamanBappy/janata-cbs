# 02: Modern Next.js (App Router) & React 19 Standards

## 1. Asynchronous Dynamic APIs (Next.js 16)

Next.js dynamically-evaluated parameters and request contexts are asynchronous Promises:
- **Cookies & Headers:** ALWAYS `await` them:

  ```ts
  // CORRECT
  const cookieStore = await cookies();
  const token = cookieStore.get("cbs_token")?.value;

  // INCORRECT - fatal runtime error
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

- **No Raw Script Tags:** React 19 prohibits inserting plain string children inside `<script>` elements during client hydration. Always use `dangerouslySetInnerHTML`.

  ```tsx
  <script
    dangerouslySetInnerHTML={{
      __html: `try{var s=localStorage.getItem('theme');...}catch(e){}`,
    }}
  />
  ```

## 3. Server Components by Default & Boundary Pruning

- Default to React Server Components (RSC) for all layouts, root wrappers, and data-fetching pages.
- Add `"use client"` only at leaf components requiring browser APIs, interactive hooks, or Zustand stores.
- **Root Provider Wrapping**: Components using Zustand store hooks (`useSessionStore`, `useWorkbenchStore`, `useAlertStore`) must be inside `<CbsAppStoreProvider>`.
