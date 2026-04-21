import { simpleGit } from "simple-git";

export interface GitContext {
  currentBranch: string;
  baseBranch: string;
  baseBranchReason: string;
  changedFilePaths: string[];
}

const CANDIDATE_BASES = ["main", "master", "develop"];

export async function analyzeGit(repoPath: string, baseBranchOverride?: string): Promise<GitContext> {
  const git = simpleGit(repoPath);

  const status = await git.status();
  const currentBranch = status.current ?? "HEAD";

  const { baseBranch, baseBranchReason } = await resolveBaseBranch(git, currentBranch, baseBranchOverride);

  const diffSummary = await git.diffSummary([`${baseBranch}...HEAD`]);
  const changedFilePaths = diffSummary.files.map((f) => f.file);

  return { currentBranch, baseBranch, baseBranchReason, changedFilePaths };
}

async function resolveBaseBranch(
  git: ReturnType<typeof simpleGit>,
  currentBranch: string,
  override?: string,
): Promise<{ baseBranch: string; baseBranchReason: string }> {
  if (override) {
    return { baseBranch: override, baseBranchReason: `manually specified as '${override}'` };
  }

  const branches = await git.branchLocal();
  const available = CANDIDATE_BASES.filter((b) => branches.all.includes(b));

  if (available.length === 0) {
    return {
      baseBranch: branches.all[0] ?? "HEAD",
      baseBranchReason: "no standard base branch found; using first available branch",
    };
  }

  // Pick the candidate the current branch diverged from most recently
  let bestBase = available[0] as string;
  let bestDistance = Infinity;

  for (const candidate of available) {
    if (candidate === currentBranch) continue;
    try {
      const mergeBase = await git.raw(["merge-base", currentBranch, candidate]);
      const log = await git.log({ from: mergeBase.trim(), to: currentBranch });
      const distance = log.total;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestBase = candidate;
      }
    } catch {
      // branch comparison failed, skip
    }
  }

  const reason =
    bestDistance === Infinity
      ? `'${bestBase}' exists locally`
      : `'${bestBase}' exists and current branch diverged ${bestDistance} commit${bestDistance === 1 ? "" : "s"} ago`;

  return { baseBranch: bestBase, baseBranchReason: reason };
}
