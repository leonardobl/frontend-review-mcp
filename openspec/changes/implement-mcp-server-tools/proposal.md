# implement-mcp-server-tools

## What

Implement the `frontend-review-mcp` MCP server — a context provider that enables AI agents to perform frontend code reviews.

The server exposes a single tool, `review_changes`, which collects everything an AI agent needs to review a Git branch: changed files with their diffs, full file contents, project context, coding rules found in the repository, and the results of automated checks (lint, typecheck, tests, build).

The AI agent calls the tool once, receives the full context, reasons about the code against the project rules, and writes inline `// REVIEW: ...` comments directly into the source files.

## Why

Frontend code review requires context that lives outside the diff: framework conventions, project naming rules, TypeScript strictness, which tests already exist, whether the build passes. Without this context, review comments are generic and miss project-specific issues.

This MCP server removes the burden of context-gathering from the AI agent. The agent focuses entirely on reasoning; the server handles discovery, file reading, and running checks.

## Non-goals

- The MCP server does **not** analyze code or produce review comments — that is the AI agent's responsibility.
- No markdown or JSON reports — inline comments are the only output format.
- No `validate_project` tool — `review_changes` runs checks as part of its execution.
- No annotated file copies — comments are written inline to the original files by the AI.

## Success criteria

- AI agent calls `review_changes` once and receives enough context to produce a meaningful review.
- The server works against any local Git repository with a frontend project.
- Partial or missing tooling (no ESLint, no tests configured) does not break execution — checks report `not_configured` or `error` gracefully.
- The server is consumable by any MCP-compatible AI agent over stdio.
