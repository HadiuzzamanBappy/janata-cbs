# 02: Modern Next.js (App Router) & React 19 Standards

## 1. Asynchronous Dynamic APIs (Next.js 16)

Next.js dynamically-evaluated parameters and request contexts are asynchronous Promises:

- **Cookies & Headers:** ALWAYS `await` them:

  ```ts
  // CORRECT (the cookie name comes from config, never a literal)
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(serverConfig.auth.cookieName)?.value;

  // INCORRECT - fatal runtime error
  const sessionId = cookies().get(serverConfig.auth.cookieName)?.value;
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

## 2. Inline scripts & raw HTML

- **Don't add inline `<script>` tags.** The theme is handled by `next-themes` (`ThemeProvider` in `src/app/layout.tsx`), and nothing else needs one.
- **`dangerouslySetInnerHTML` is a security review item.** It's allowed only for a static, hard-coded string. Never interpolate record data, user input or core responses into it: that's an XSS hole in a banking app. Render data as React children instead.

## 3. Server Components by Default & Boundary Pruning

- Default to React Server Components (RSC) for all layouts, root wrappers, and data-fetching pages.
- Add `"use client"` only at leaf components requiring browser APIs, interactive hooks, or Zustand stores.
- **Root Provider Wrapping**: Components using Zustand store hooks (`useSessionStore`, `useWorkbenchStore`, `useAlertStore`) must be inside `<CbsAppStoreProvider>`.
