import "server-only";
import fs from "node:fs";
import path from "node:path";

export interface DocFileResult {
  filePath: string;
  relativePath: string;
  content: string;
  exists: boolean;
}

/**
 * Reads a markdown documentation file from the specified docs subfolder.
 * @param slug Route slug array from Next.js dynamic route
 * @param baseSubFolder Subfolder under process.cwd()/docs (e.g. "" for devs hub, "manual" for officer manual)
 */
export function readDocFile(slug?: string[], baseSubFolder = ""): DocFileResult {
  const relativePath = slug && slug.length > 0 ? `${slug.join("/")}.md` : "README.md";

  const filePath = baseSubFolder
    ? path.join(process.cwd(), "docs", baseSubFolder, relativePath)
    : path.join(process.cwd(), "docs", relativePath);

  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      relativePath,
      content: "",
      exists: false,
    };
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return {
    filePath,
    relativePath,
    content,
    exists: true,
  };
}
