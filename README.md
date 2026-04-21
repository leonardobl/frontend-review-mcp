# frontend-review-mcp

MCP server for AI-powered frontend code review.

It provides a single tool — `review_changes` — that collects everything an AI agent needs to review a Git branch: changed files with diffs and full contents, project context, coding rules found in the repository, and results from automated checks (lint, typecheck, tests, build).

The AI agent calls the tool once, receives the full context, reasons about the code, and writes inline `// REVIEW: ...` comments directly into the source files.

```
AI Agent (Claude, Copilot, OpenCode...)
  │
  │  review_changes({ repoPath, baseBranch?, runChecks? })
  ▼
frontend-review-mcp
  ├── detects current branch and base branch
  ├── reads changed files + diffs
  ├── collects project rules (CLAUDE.md, eslint config, conventions...)
  └── runs lint / typecheck / test / build
  │
  │  ReviewContext (JSON)
  ▼
AI Agent → reasons → writes // REVIEW: comments inline
```

---

## Requirements

- Node.js >= 20
- npm >= 10

---

## Installation

```bash
git clone <repo-url>
cd frontend-review-mcp
npm install
npm run build
```

---

## Running

### Option 1 — start.sh (recommended)

```bash
./start.sh
```

### Option 2 — npm

```bash
npm start
```

### Option 3 — development mode (auto-reload)

```bash
npm run dev
```

---

## Tool reference

### `review_changes`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repoPath` | string | yes | Absolute path to the local Git repository |
| `baseBranch` | string | no | Base branch to compare against (auto-detected if omitted) |
| `runChecks` | boolean | no | Run lint/typecheck/test/build (default: `true`) |

**Returns** a `ReviewContext` object:

```json
{
  "currentBranch": "feature/checkout",
  "baseBranch": "main",
  "baseBranchReason": "'main' exists and current branch diverged 3 commits ago",
  "projectContext": {
    "framework": "next",
    "language": "typescript",
    "packageManager": "npm",
    "hasMonorepo": false
  },
  "projectRules": "### CLAUDE.md\n\n...",
  "changedFiles": [
    {
      "path": "src/app/page.tsx",
      "content": "...",
      "diff": "@@ -10,6 +10,8 @@\n..."
    }
  ],
  "checks": {
    "lint": "passed",
    "typecheck": "passed",
    "test": "not_configured",
    "build": "passed"
  }
}
```

---

## Configuration in AI clients

### Claude Code

Add to your project's `.claude/settings.json` or to the global Claude Code settings:

```json
{
  "mcpServers": {
    "frontend-review": {
      "command": "node",
      "args": ["/absolute/path/to/frontend-review-mcp/dist/index.js"]
    }
  }
}
```

Then ask Claude:

> "Use the review_changes tool on /path/to/my/project and write inline REVIEW comments on the changed files."

### GitHub Copilot (VS Code)

Add to your VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "mcp.servers": {
    "frontend-review": {
      "command": "node",
      "args": ["/absolute/path/to/frontend-review-mcp/dist/index.js"],
      "type": "stdio"
    }
  }
}
```

Then ask Copilot Chat:

> "Use frontend-review to review the changes on this branch at /path/to/my/project."

### OpenCode

Add to your `~/.config/opencode/config.json` (or project-level `opencode.json`):

```json
{
  "mcp": {
    "frontend-review": {
      "type": "local",
      "command": ["/path/to/node", "/path/to/frontend-review-mcp/dist/index.js"],
      "enabled": true
    }
  }
}
```

> **Note:** `command` is an array — the first element is the absolute path to the `node` binary, the second is the absolute path to `dist/index.js`. Using absolute paths avoids issues with different Node.js versions or nvm environments.
>
> To find your node path: `which node` (or `nvm which current` if using nvm).

Example with nvm:

```json
{
  "mcp": {
    "frontend-review": {
      "type": "local",
      "command": ["/root/.nvm/versions/node/v22.22.2/bin/node", "/www/Mcps/frontend-review-mcp/dist/index.js"],
      "enabled": true
    }
  }
}
```

Then ask:

> "Call review_changes on /path/to/my/project and annotate the changed files."

---

## How the review works

1. The AI agent calls `review_changes` with the path to your repo
2. The server returns the full context: diffs, file contents, project rules, check results
3. The AI reads the context and identifies issues
4. The AI writes `// REVIEW[severity]: ...` comments inline in the original files
5. Review the annotations, apply what makes sense, then clean up with `git restore .`

Example annotation written by the AI:

```ts
// REVIEW[high]: function name is ambiguous and violates project naming convention.
// Convention (from CLAUDE.md): functions should use camelCase + action verb.
// Suggestion: rename to `getUserCheckoutData()`.
function xpto() {
  ...
}
```

---

## Project rules detection

The server automatically collects rules from these files if present in the target repo:

- `CLAUDE.md`
- `CONVENTIONS.md`
- `.cursorrules`
- `CONTRIBUTING.md` (sections mentioning conventions/naming/style)
- `eslint.config.js` / `.eslintrc*`

---

## Development

```bash
npm run dev        # watch mode
npm run typecheck  # type check only
npm run lint       # lint only
npm test           # run tests
npm run build      # compile to dist/
```
