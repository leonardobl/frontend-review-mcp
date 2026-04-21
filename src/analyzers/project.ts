import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Framework, Language, ProjectContext } from "../types/index.js";

export interface ProjectAnalysis {
  projectContext: ProjectContext;
  projectRules: string;
}

const RULE_FILES = [
  { name: "CLAUDE.md", full: true },
  { name: "CONVENTIONS.md", full: true },
  { name: ".cursorrules", full: true },
  { name: "CONTRIBUTING.md", full: false },
  { name: "eslint.config.js", full: true },
  { name: "eslint.config.mjs", full: true },
  { name: ".eslintrc", full: true },
  { name: ".eslintrc.js", full: true },
  { name: ".eslintrc.json", full: true },
];

const CONVENTION_KEYWORDS =
  /convention|naming|style|rule|standard|guideline|format/i;

export async function analyzeProject(
  repoPath: string,
): Promise<ProjectAnalysis> {
  const pkg = readPackageJson(repoPath);

  return {
    projectContext: {
      framework: detectFramework(pkg),
      language: detectLanguage(repoPath),
      packageManager: detectPackageManager(repoPath),
      hasMonorepo: detectMonorepo(repoPath),
    },
    projectRules: collectRules(repoPath),
  };
}

function readPackageJson(repoPath: string): Record<string, unknown> {
  const pkgPath = join(repoPath, "package.json");
  if (!existsSync(pkgPath)) return {};
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return {};
  }
}

function detectFramework(pkg: Record<string, unknown>): Framework {
  const deps = {
    ...((pkg.dependencies as Record<string, unknown>) ?? {}),
    ...((pkg.devDependencies as Record<string, unknown>) ?? {}),
  };
  if ("next" in deps) return "next";
  if ("react" in deps || "react-dom" in deps) return "react";
  if ("vue" in deps) return "vue";
  if ("svelte" in deps) return "svelte";
  return "unknown";
}

function detectLanguage(repoPath: string): Language {
  const hasTsConfig = existsSync(join(repoPath, "tsconfig.json"));
  const hasJsFiles =
    existsSync(join(repoPath, "src")) || existsSync(join(repoPath, "index.js"));
  if (hasTsConfig && hasJsFiles) return "mixed";
  if (hasTsConfig) return "typescript";
  return "javascript";
}

function detectPackageManager(
  repoPath: string,
): ProjectContext["packageManager"] {
  if (existsSync(join(repoPath, "bun.lockb"))) return "bun";
  if (existsSync(join(repoPath, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(repoPath, "yarn.lock"))) return "yarn";
  if (existsSync(join(repoPath, "package-lock.json"))) return "npm";
  return "unknown";
}

function detectMonorepo(repoPath: string): boolean {
  for (const dir of ["packages", "apps"]) {
    const candidate = join(repoPath, dir);
    if (!existsSync(candidate)) continue;
    try {
      const entries = readdirSync(candidate);
      if (entries.some((e) => existsSync(join(candidate, e, "package.json"))))
        return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function collectRules(repoPath: string): string {
  const parts: string[] = [];

  for (const { name, full } of RULE_FILES) {
    const filePath = join(repoPath, name);
    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, "utf-8");
      if (full) {
        parts.push(`### ${name}\n\n${content}`);
      } else {
        const relevantLines = filterRelevantSections(content);
        if (relevantLines)
          parts.push(`### ${name} (relevant sections)\n\n${relevantLines}`);
      }
    } catch {
      // skip unreadable files
    }
  }

  return parts.join("\n\n---\n\n");
}

function filterRelevantSections(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inRelevantSection = false;

  for (const line of lines) {
    if (line.startsWith("#")) {
      inRelevantSection = CONVENTION_KEYWORDS.test(line);
    }
    if (inRelevantSection || CONVENTION_KEYWORDS.test(line)) {
      result.push(line);
    }
  }

  return result.join("\n").trim();
}
