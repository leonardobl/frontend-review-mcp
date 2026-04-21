import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock simple-git before importing modules that use it
vi.mock("simple-git", () => ({
  simpleGit: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
  };
});

import { simpleGit } from "simple-git";
import * as fs from "fs";

describe("analyzeGit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns current branch and detects base branch", async () => {
    const mockGit = {
      status: vi.fn().mockResolvedValue({ current: "feature/my-feature" }),
      branchLocal: vi.fn().mockResolvedValue({ all: ["main", "feature/my-feature"] }),
      raw: vi.fn().mockResolvedValue("abc123\n"),
      log: vi.fn().mockResolvedValue({ total: 3 }),
      diffSummary: vi.fn().mockResolvedValue({ files: [{ file: "src/app.tsx" }] }),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit as never);

    const { analyzeGit } = await import("../src/analyzers/git.js");
    const result = await analyzeGit("/fake/repo");

    expect(result.currentBranch).toBe("feature/my-feature");
    expect(result.baseBranch).toBe("main");
    expect(result.baseBranchReason).toContain("main");
    expect(result.changedFilePaths).toEqual(["src/app.tsx"]);
  });

  it("uses baseBranch override when provided", async () => {
    const mockGit = {
      status: vi.fn().mockResolvedValue({ current: "feature/x" }),
      branchLocal: vi.fn().mockResolvedValue({ all: ["main"] }),
      diffSummary: vi.fn().mockResolvedValue({ files: [] }),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit as never);

    const { analyzeGit } = await import("../src/analyzers/git.js");
    const result = await analyzeGit("/fake/repo", "develop");

    expect(result.baseBranch).toBe("develop");
    expect(result.baseBranchReason).toContain("manually specified");
  });
});

describe("analyzeProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("detects Next.js + TypeScript project", async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const path = String(p);
      return path.endsWith("package.json") || path.endsWith("tsconfig.json");
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        dependencies: { next: "14.0.0", react: "18.0.0" },
      }),
    );
    vi.mocked(fs.readdirSync).mockReturnValue([]);

    const { analyzeProject } = await import("../src/analyzers/project.js");
    const result = await analyzeProject("/fake/repo");

    expect(result.projectContext.framework).toBe("next");
    expect(result.projectContext.language).toBe("typescript");
  });

  it("returns unknown framework when no known deps found", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue("{}");
    vi.mocked(fs.readdirSync).mockReturnValue([]);

    const { analyzeProject } = await import("../src/analyzers/project.js");
    const result = await analyzeProject("/fake/repo");

    expect(result.projectContext.framework).toBe("unknown");
  });
});

describe("analyzeDiff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters to frontend files only", async () => {
    const mockGit = {
      diff: vi.fn().mockResolvedValue("@@ -1,3 +1,4 @@\n+const x = 1;"),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit as never);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("const x = 1;");

    const { analyzeDiff } = await import("../src/analyzers/diff.js");
    const result = await analyzeDiff("/fake/repo", "main", [
      "src/app.tsx",
      "README.md",
      "package.json",
      "src/styles.css",
    ]);

    expect(result.map((f) => f.path)).toEqual(["src/app.tsx", "src/styles.css"]);
  });

  it("handles deleted files gracefully", async () => {
    const mockGit = {
      diff: vi.fn().mockResolvedValue(""),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit as never);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { analyzeDiff } = await import("../src/analyzers/diff.js");
    const result = await analyzeDiff("/fake/repo", "main", ["src/deleted.tsx"]);

    expect(result[0]?.content).toBe("");
  });
});
