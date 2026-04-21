import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { CheckStatus } from "../types/index.js";

export function runLint(repoPath: string): CheckStatus {
  const hasEslint =
    existsSync(join(repoPath, "eslint.config.js")) ||
    existsSync(join(repoPath, "eslint.config.mjs")) ||
    existsSync(join(repoPath, ".eslintrc")) ||
    existsSync(join(repoPath, ".eslintrc.js")) ||
    existsSync(join(repoPath, ".eslintrc.json")) ||
    existsSync(join(repoPath, ".eslintrc.yml")) ||
    existsSync(join(repoPath, ".eslintrc.yaml"));

  const hasBiome = existsSync(join(repoPath, "biome.json"));

  if (!hasEslint && !hasBiome) return "not_configured";

  try {
    const cmd = hasEslint ? "npx eslint . --max-warnings=0" : "npx biome check .";
    execSync(cmd, { cwd: repoPath, stdio: "pipe" });
    return "passed";
  } catch {
    return "failed";
  }
}
