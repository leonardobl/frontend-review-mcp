# Tasks — implement-mcp-server-tools

## [x] 1. Clean up out-of-scope files

Delete stubs that are no longer part of the design:

- `src/tools/validate.ts`
- `src/analyzers/code.ts`
- `src/reporters/markdown.ts`
- `src/reporters/json.ts`
- `src/reporters/annotated.ts`
- `src/reporters/index.ts`

Update `src/tools/index.ts` to export only `review.ts`.

## [x] 2. Update types

Update `src/types/index.ts`:

- Add `ChangedFile` interface: `{ path: string; content: string; diff: string }`
- Add `ReviewContext` interface (replaces `ReviewResult` as the tool's return type)
- Remove `ReviewResult`, `ReviewSummary`, `ArtifactPaths` (no longer produced by server)
- Remove `generateArtifacts` and `outputDir` from `ReviewOptions`
- Keep: `Framework`, `Language`, `Severity`, `CheckStatus`, `ProjectContext`, `Checks`

## [x] 3. Implement `analyzers/git.ts`

## [x] 4. Implement `analyzers/project.ts`

## [x] 5. Implement `analyzers/diff.ts`

## [x] 6. Implement `validators/lint.ts`

## [x] 7. Implement `validators/typecheck.ts`

## [x] 8. Implement `validators/test.ts`

## [x] 9. Implement `validators/build.ts`

## [x] 10. Implement `src/tools/review.ts`

## [x] 11. Implement `src/server.ts`

## [x] 12. Implement `src/index.ts`

## [x] 13. Write tests

13/13 tests passing.

## [x] 14. Verify end-to-end

- `npm run typecheck` — clean
- `npm run build` — clean
- `npm test` — 13/13 passed
