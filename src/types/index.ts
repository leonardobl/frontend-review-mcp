export type Framework = "next" | "react" | "vue" | "svelte" | "unknown";
export type Language = "typescript" | "javascript" | "mixed";
export type CheckStatus = "passed" | "failed" | "not_configured" | "error";

export interface ProjectContext {
  framework: Framework;
  language: Language;
  hasMonorepo: boolean;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "unknown";
}

export interface Checks {
  lint: CheckStatus;
  typecheck: CheckStatus;
  test: CheckStatus;
  build: CheckStatus;
}

export interface ChangedFile {
  path: string;
  content: string;
  diff: string;
}

export interface ReviewContext {
  currentBranch: string;
  baseBranch: string;
  baseBranchReason: string;
  projectContext: ProjectContext;
  projectRules: string;
  changedFiles: ChangedFile[];
  checks: Checks;
}

export interface ReviewOptions {
  repoPath: string;
  baseBranch?: string;
  runChecks?: boolean;
}
