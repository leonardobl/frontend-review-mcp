import { existsSync } from "fs";
import { z } from "zod";
import { analyzeGit } from "../analyzers/git.js";
import { analyzeProject } from "../analyzers/project.js";
import { analyzeDiff } from "../analyzers/diff.js";
import { runLint } from "../validators/lint.js";
import { runTypecheck } from "../validators/typecheck.js";
import { runTests } from "../validators/test.js";
import { runBuild } from "../validators/build.js";
import type { ReviewContext, Checks, CheckStatus } from "../types/index.js";

export const reviewOptionsSchema = z.object({
  repoPath: z.string().describe("Absolute path to the local Git repository to review"),
  baseBranch: z.string().optional().describe("Base branch to compare against (auto-detected if omitted)"),
  runChecks: z.boolean().optional().describe("Run lint, typecheck, test, and build checks (default: true)"),
});

export type ReviewOptionsInput = z.infer<typeof reviewOptionsSchema>;

export async function reviewChanges(input: ReviewOptionsInput): Promise<ReviewContext> {
  const { repoPath, baseBranch: baseBranchOverride, runChecks = true } = input;

  if (!existsSync(repoPath)) {
    throw new Error(`repoPath does not exist: ${repoPath}`);
  }

  const gitContext = await analyzeGit(repoPath, baseBranchOverride);
  const { projectContext, projectRules } = await analyzeProject(repoPath);
  const changedFiles = await analyzeDiff(repoPath, gitContext.baseBranch, gitContext.changedFilePaths);

  const checks: Checks = runChecks
    ? {
        lint: safeRun(() => runLint(repoPath)),
        typecheck: safeRun(() => runTypecheck(repoPath)),
        test: safeRun(() => runTests(repoPath)),
        build: safeRun(() => runBuild(repoPath)),
      }
    : { lint: "not_configured", typecheck: "not_configured", test: "not_configured", build: "not_configured" };

  return {
    currentBranch: gitContext.currentBranch,
    baseBranch: gitContext.baseBranch,
    baseBranchReason: gitContext.baseBranchReason,
    projectContext,
    projectRules,
    changedFiles,
    checks,
  };
}

function safeRun(fn: () => CheckStatus): CheckStatus {
  try {
    return fn();
  } catch {
    return "error";
  }
}
