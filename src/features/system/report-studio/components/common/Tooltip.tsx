/**
 * Tooltip wrapper that defers to the browser's native `title` attribute.
 *
 * The monolith used `title="..."` everywhere — there's no custom tooltip
 * component, and adding one wholesale would change behaviour (custom
 * tooltips don't show until hover-delay elapses; native `title` shows after
 * the OS-configured delay). This wrapper exists so future calls can pass
 * through `Tooltip` and we can swap the implementation in one place if we
 * ever want richer tooltips, without retrofitting every call site.
 *
 * Keep this trivial — anything more complex defeats the "behaviour identical
 * to the monolith" promise.
 */

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}): ReactElement {
  if (isValidElement(children)) {
    const existing = (children.props as any)?.title;
    return cloneElement(children, {
      // Preserve any title the child already had — append, separated by " · ".
      title: existing ? `${existing} · ${text}` : text,
    } as any);
  }
  // Plain text/fragment children — wrap in a span so we have a node to set
  // the `title` on. Span is inline so it shouldn't disturb layout.
  return <span title={text}>{children}</span>;
}
