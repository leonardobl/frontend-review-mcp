import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { reviewOptionsSchema, reviewChanges } from "./tools/review.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "frontend-review", version: "0.1.0" });

  server.registerTool(
    "review_changes",
    {
      description:
        "Collects the full context needed to review frontend code changes in a Git repository: " +
        "changed files with diffs and full contents, project context (framework, language, package manager), " +
        "coding rules found in the repo, and results from lint/typecheck/test/build checks. " +
        "Use the returned context to reason about the code and write inline // REVIEW: comments.",
      inputSchema: reviewOptionsSchema,
    },
    async ({ repoPath, baseBranch, runChecks }) => {
      try {
        const context = await reviewChanges({ repoPath, baseBranch, runChecks });
        return {
          content: [{ type: "text", text: JSON.stringify(context, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
