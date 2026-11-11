import type * as React from "react";

// ---------------------------------------------------------------------------
// Pure-React JSON Syntax Highlighting Tokenizer (Semantic Tokens)
// ---------------------------------------------------------------------------
const JSON_TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

export function renderHighlightedTokens(
  content: string,
  lineIndex: number | string,
): React.ReactNode {
  const tokenRegex = new RegExp(JSON_TOKEN_REGEX.source, "g");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = tokenRegex.exec(content);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const [, keyMatch, stringMatch, boolMatch, numberMatch, punctMatch] = match;

    if (keyMatch) {
      const colonIndex = keyMatch.lastIndexOf(":");
      const keyStr = keyMatch.slice(0, colonIndex);
      parts.push(
        <span key={`${lineIndex}-k-${match.index}`} className="text-primary font-medium">
          {keyStr}
        </span>,
      );
      parts.push(
        <span key={`${lineIndex}-c-${match.index}`} className="text-muted-foreground/60">
          :
        </span>,
      );
    } else if (stringMatch) {
      parts.push(
        <span key={`${lineIndex}-s-${match.index}`} className="text-foreground font-normal">
          {stringMatch}
        </span>,
      );
    } else if (boolMatch) {
      if (boolMatch === "null") {
        parts.push(
          <span
            key={`${lineIndex}-n-${match.index}`}
            className="text-destructive italic font-medium"
          >
            {boolMatch}
          </span>,
        );
      } else {
        parts.push(
          <span key={`${lineIndex}-b-${match.index}`} className="text-primary/90 font-semibold">
            {boolMatch}
          </span>,
        );
      }
    } else if (numberMatch) {
      parts.push(
        <span key={`${lineIndex}-num-${match.index}`} className="text-foreground/90 font-semibold">
          {numberMatch}
        </span>,
      );
    } else if (punctMatch) {
      parts.push(
        <span key={`${lineIndex}-p-${match.index}`} className="text-muted-foreground">
          {punctMatch}
        </span>,
      );
    }

    lastIndex = tokenRegex.lastIndex;
    match = tokenRegex.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export function renderJsonLine(line: string, lineIndex: number): React.ReactNode {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const content = line.slice(indent.length);

  if (!content) {
    return (
      <div key={lineIndex} className="leading-5 h-5">
        &nbsp;
      </div>
    );
  }

  return (
    <div key={lineIndex} className="leading-5 whitespace-pre">
      {indent}
      {renderHighlightedTokens(content, lineIndex)}
    </div>
  );
}
