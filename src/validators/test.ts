import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { CheckStatus } from "../types/index.js";

export function runTests(repoPath: string): CheckStatus {
  const pkgPath = join(repoPath, "package.json");
  if (!existsSync(pkgPath)) return "not_configured";

  let scripts: Record<string, string> = {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    scripts = pkg.scripts ?? {};
  } catch {
    return "error";
  }

  if (!("test" in scripts) && !("vitest" in scripts)) return "not_configured";

  try {
    const cmd = "vitest" in scripts ? "npx vitest run" : "npm test --if-present";
    execSync(cmd, { cwd: repoPath, stdio: "pipe" });
    return "passed";
  } catch {
    return "failed";
  }
}
