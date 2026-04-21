import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { simpleGit } from "simple-git";
import type { ChangedFile } from "../types/index.js";

const FRONTEND_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".sass",
  ".vue",
  ".svelte",
]);

export async function analyzeDiff(
  repoPath: string,
  baseBranch: string,
  changedFilePaths: string[],
): Promise<ChangedFile[]> {
  const git = simpleGit(repoPath);

  const frontendPaths = changedFilePaths.filter((p) => {
    const ext = "." + p.split(".").pop();
    return FRONTEND_EXTENSIONS.has(ext);
  });

  const results: ChangedFile[] = [];

  for (const filePath of frontendPaths) {
    const absolutePath = join(repoPath, filePath);

    let content = "";
    if (existsSync(absolutePath)) {
      try {
        content = readFileSync(absolutePath, "utf-8");
      } catch {
        content = "";
      }
    }

    let diff = "";
    try {
      diff = await git.diff([`${baseBranch}...HEAD`, "--", filePath]);
    } catch {
      diff = "";
    }

    results.push({ path: filePath, content, diff });
  }

  return results;
}
