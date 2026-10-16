// Documentation Viewer Component
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/features/docs";
import { readDocFile } from "@/features/docs/utils/doc-file-reader";
import { DocNotFound } from "./doc-not-found";

interface DocViewerProps {
  portal: "devs" | "manual";
  slug?: string[];
}

export function DocViewer({ portal, slug }: DocViewerProps) {
  const { content: fileContent, exists } = readDocFile(slug, portal);

  if (!exists) {
    return <DocNotFound portal={portal} />;
  }

  return (
    <article className="space-y-4">
      {/* Rich Markdown Container */}
      <div className="rounded-md border bg-card p-6 sm:p-8 md:p-9 shadow-xs leading-relaxed text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3 mb-5 mt-1">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground border-b border-border/60 pb-2 mb-3.5 mt-8">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold tracking-tight text-foreground mb-2.5 mt-5">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-2 mb-4 text-xs sm:text-sm text-muted-foreground pl-1.5">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2 mb-4 text-xs sm:text-sm text-muted-foreground pl-1.5">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const isMermaid = match && match[1] === "mermaid";

              if (isMermaid) {
                return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
              }

              const isInline = !className && !String(children).includes("\n");
              if (isInline) {
                return (
                  <code
                    className="bg-muted px-1 py-0.5 rounded-xs text-[11px] font-mono text-primary font-medium border border-border/60"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <div className="my-3 overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-foreground font-mono text-xs shadow-2xs">
                  <code {...props}>{children}</code>
                </div>
              );
            },
            pre: ({ children }) => <pre className="p-0 m-0">{children}</pre>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary pl-3 py-1 italic my-3 text-xs text-muted-foreground bg-muted/20 rounded-r-xs">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto rounded-md border border-border/60">
                <table className="w-full text-left text-xs">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
                {children}
              </thead>
            ),
            tr: ({ children }) => (
              <tr className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition">
                {children}
              </tr>
            ),
            th: ({ children }) => <th className="p-2.5 font-medium">{children}</th>,
            td: ({ children }) => <td className="p-2.5 text-muted-foreground">{children}</td>,
            a: ({ href, children }) => {
              let targetHref = href || "#";

              if (targetHref.startsWith("http://") || targetHref.startsWith("https://")) {
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
                const cleanPath = targetHref.split(`${portal}/`)[1]?.replace(/\.md$/, "");
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
