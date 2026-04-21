import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { CheckStatus } from "../types/index.js";

export function runBuild(repoPath: string): CheckStatus {
  const pkgPath = join(repoPath, "package.json");
  if (!existsSync(pkgPath)) return "not_configured";

  let scripts: Record<string, string> = {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    scripts = pkg.scripts ?? {};
  } catch {
    return "error";
  }

  if (!("build" in scripts)) return "not_configured";

  try {
    execSync("npm run build", { cwd: repoPath, stdio: "pipe" });
    return "passed";
  } catch {
    return "failed";
  }
}
