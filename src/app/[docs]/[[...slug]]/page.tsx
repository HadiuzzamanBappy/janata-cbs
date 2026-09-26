// Unified Documentation Portal Catch-All Page (Powers /devs/*, /manual/*, etc.)
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/features/docs";
import { readDocFile } from "@/features/docs/utils/doc-file-reader";

export const dynamic = "force-dynamic";

export default async function GenericDocPage({
  params,
}: {
  params: Promise<{ docs: string; slug?: string[] }>;
}) {
  const { docs: portal, slug } = await params;
  const {
    relativePath,
    content: fileContent,
    exists,
  } = readDocFile(slug, portal);

  if (!exists) {
    notFound();
  }

  const isManual = portal === "manual";
  const portalLabel = isManual
    ? "Officer Operating Manual"
    : "Markdown Render Engine";

  return (
    <article className="space-y-6">
      {/* File Breadcrumb Badge */}
      <div className="flex items-center justify-between border-b pb-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span className="text-primary font-semibold">{portal}/</span>
          <span>{relativePath}</span>
        </div>
        <span className="text-muted-foreground/60">{portalLabel}</span>
      </div>

      {/* Rich Markdown Container */}
      <div className="rounded-xl border bg-card p-8 md:p-10 shadow-xs leading-relaxed text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground border-b pb-3 mb-6 mt-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground border-b pb-2 mb-4 mt-8">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold tracking-tight text-foreground mb-3 mt-6">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-sm md:text-base text-muted-foreground leading-7 mb-4">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1.5 mb-4 text-sm md:text-base text-muted-foreground pl-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1.5 mb-4 text-sm md:text-base text-muted-foreground pl-2">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-7">{children}</li>,
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const isMermaid = match && match[1] === "mermaid";

              if (isMermaid) {
                return (
                  <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
                );
              }

              const isInline = !className && !String(children).includes("\n");
              if (isInline) {
                return (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary font-medium border"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <div className="my-4 overflow-x-auto rounded-lg border border-border bg-slate-100/80 dark:bg-zinc-950 p-4 text-slate-900 dark:text-zinc-50 font-mono text-xs shadow-xs">
                  <code {...props}>{children}</code>
                </div>
              );
            },
            pre: ({ children }) => <pre className="p-0 m-0">{children}</pre>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 py-1 italic my-4 text-muted-foreground bg-muted/30 rounded-r">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-6 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs md:text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                {children}
              </thead>
            ),
            tr: ({ children }) => (
              <tr className="border-b last:border-0 hover:bg-muted/20 transition">
                {children}
              </tr>
            ),
            th: ({ children }) => <th className="p-3">{children}</th>,
            td: ({ children }) => (
              <td className="p-3 text-muted-foreground">{children}</td>
            ),
            a: ({ href, children }) => {
              let targetHref = href || "#";

              if (
                targetHref.startsWith("http://") ||
                targetHref.startsWith("https://")
              ) {
                return (
                  <a
                    href={targetHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {children}
                  </a>
                );
              }

              if (targetHref.includes(`${portal}/`)) {
                const cleanPath = targetHref
                  .split(`${portal}/`)[1]
                  ?.replace(/\.md$/, "");
                targetHref = `/${portal}/${cleanPath}`;
              } else {
                targetHref = `/${portal}/${targetHref.replace(/\.md$/, "")}`;
              }

              return (
                <Link
                  href={targetHref}
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  {children}
                </Link>
              );
            },
          }}
        >
          {fileContent}
        </ReactMarkdown>
      </div>
    </article>
  );
}
