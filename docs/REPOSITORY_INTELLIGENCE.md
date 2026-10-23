# ENJAZ Repository Intelligence

Repository Intelligence helps workspace members discover public GitHub projects and evaluate them for safe, license-aware reuse in ENJAZ.

## API

Both endpoints require a valid Supabase-authenticated user with access to the requested workspace.

### Search repositories

`GET /api/v1/repository-intelligence/search?workspaceId=<id>&q=<query>&language=JavaScript&limit=10`

- `q`: required search terms (at least 2 characters).
- `language`: optional GitHub language filter.
- `limit`: clamped to 1–20.
- Returns repository metadata, stars, license identifier, update time, and links.

### Analyze a repository

`POST /api/v1/repository-intelligence/analyze?workspaceId=<id>`

Requires workspace owner/admin/manager access.

```json
{
  "fullName": "owner/repository",
  "goal": "Find useful, safe improvements for ENJAZ"
}
```

The service retrieves repository metadata and its README, then uses ENJAZ's configured AI provider router to return a structured assessment: relevance score, license risk, compatibility, security concerns, opportunities, recommendation, and next steps.

## Configuration and safeguards

- `OPENAI_API_KEY` (or another provider supported by the existing AI router) enables AI assessment.
- Optional `GITHUB_TOKEN` increases GitHub API rate limits. Keep it server-side; never expose it to the browser.
- Repository text is treated as untrusted input, not instructions.
- The service does not execute or copy third-party code. A missing license is flagged as unclear; verify license terms before reuse.
- Search results and analysis are advisory. Implementation must happen on an isolated branch and pass project tests before a pull request is considered mergeable.
- Main is not modified or auto-merged by this feature.

## Validation

Run the API test suite from the repository root with:

`pnpm --filter @enjaz/api test`
