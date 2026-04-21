import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return { ...actual, existsSync: vi.fn(), readFileSync: vi.fn() };
});

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import * as fs from "fs";
import * as cp from "child_process";

describe("runLint", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns not_configured when no linter config found", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const { runLint } = await import("../src/validators/lint.js");
    expect(runLint("/fake/repo")).toBe("not_configured");
  });

  it("returns passed when linter exits cleanly", async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => String(p).endsWith("eslint.config.js"));
    vi.mocked(cp.execSync).mockReturnValue(Buffer.from(""));
    const { runLint } = await import("../src/validators/lint.js");
    expect(runLint("/fake/repo")).toBe("passed");
  });

  it("returns failed when linter exits with error", async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => String(p).endsWith("eslint.config.js"));
    vi.mocked(cp.execSync).mockImplementation(() => { throw new Error("lint error"); });
    const { runLint } = await import("../src/validators/lint.js");
    expect(runLint("/fake/repo")).toBe("failed");
  });
});

describe("runTypecheck", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns not_configured when no tsconfig", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const { runTypecheck } = await import("../src/validators/typecheck.js");
    expect(runTypecheck("/fake/repo")).toBe("not_configured");
  });

  it("returns passed on clean tsc run", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(cp.execSync).mockReturnValue(Buffer.from(""));
    const { runTypecheck } = await import("../src/validators/typecheck.js");
    expect(runTypecheck("/fake/repo")).toBe("passed");
  });
});

describe("runTests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns not_configured when no test script", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ scripts: {} }));
    const { runTests } = await import("../src/validators/test.js");
    expect(runTests("/fake/repo")).toBe("not_configured");
  });

  it("returns passed when tests pass", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ scripts: { test: "vitest run" } }));
    vi.mocked(cp.execSync).mockReturnValue(Buffer.from(""));
    const { runTests } = await import("../src/validators/test.js");
    expect(runTests("/fake/repo")).toBe("passed");
  });
});
