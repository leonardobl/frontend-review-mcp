import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { CheckStatus } from "../types/index.js";

export function runTypecheck(repoPath: string): CheckStatus {
  if (!existsSync(join(repoPath, "tsconfig.json"))) return "not_configured";

  try {
    execSync("npx tsc --noEmit", { cwd: repoPath, stdio: "pipe" });
    return "passed";
  } catch {
    return "failed";
  }
}
