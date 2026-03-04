# Sync PR Changes to Notion Documentation

## Overview
When a pull request is created or updated on `manasisoman/marketplace`, this playbook instructs Devin to analyze the PR diff, classify the change, and update the relevant Notion documentation (PRD, TDD, API Reference) if needed.

## Required from User
- Devin must have access to the Notion MCP integration (already configured).
- The PR number and repository are provided via the session prompt (injected by the GitHub Actions workflow).

## Procedure

### 1. Read the PR diff
- Use `git_view_pr` to retrieve the full PR diff, description, and metadata.
- Identify all changed files and summarize the nature of the changes.

### 2. Classify the change
Determine which category the PR falls into:

| Change Type | Documentation Action |
|-------------|---------------------|
| **Behavioral changes** (new features, changed API responses, new UI interactions) | Full documentation update across PRD, TDD, and API Reference. |
| **Refactors** (renamed internals, code reorganization with no runtime impact) | Changelog entry only in API Reference Section 10. Do NOT update endpoint docs, schemas, or PRD. |
| **Configuration changes** (environment variables, CORS origins, port changes) | Update TDD deployment/config sections only. No PRD changes unless user-facing. |
| **API changes** (new/modified/removed endpoints, changed request/response shapes) | Full update to API Reference endpoints, schemas, error reference, auth matrix, and changelog. Update TDD endpoint table. Update PRD functional requirements if user-facing. |
| **Customer-specific overrides** (feature flags, tenant-specific logic) | Document in TDD only with a callout noting the override scope. |
| **Temporary workarounds** (hotfixes, monkey-patches, known-issue bypasses) | Changelog entry only. Do NOT add to PRD or API Reference. |

If the change is a pure refactor with no runtime impact, append a note in the Changelog only.

**Do not hallucinate intent.** If intent is unclear from the PR diff and context, post a comment on the PR stating:
> "Intent unclear from PR context. Please clarify whether this change is user-facing and which documentation sections (if any) should be updated."

Then stop. Do not proceed with documentation updates.

### 3. Invoke the sync-notion-docs skill
If documentation updates are needed, invoke the skill at `.agents/skills/sync-notion-docs/SKILL.md` and follow it as a strict checklist. The skill contains:
- Notion document IDs for PRD, TDD, and API Reference
- Exact formatting conventions (table attributes, callout syntax, color codes)
- Section-by-section instructions for each document
- A completion checklist

### 4. Report results
After completing documentation updates (or determining none are needed):
- Post a comment on the PR summarizing what was updated (or why no updates were needed).
- Format the comment as:

```
## Notion Documentation Sync

**Change classification**: [type]

**Documents updated**:
- [ ] PRD (Section X.X)
- [ ] TDD (Section X.X)
- [ ] API Reference (Section X.X)

**Summary**: [brief description of what was added/changed in each document]
```

If no documentation update was needed, comment:
```
## Notion Documentation Sync

**Change classification**: [type] (no doc update required)

No Notion documentation changes needed for this PR.
```

## Guardrails

You MUST follow these rules:

1. **Only modify relevant sections.** Do not touch sections unrelated to the code change.
2. **Never rewrite the entire page.** Use targeted insert/replace operations only.
3. **Never remove content unless explicitly deleted in code.**
4. **Avoid duplication.** Fetch each document first and confirm the content does not already exist.
5. **Preserve formatting and headers exactly.** Match existing color attributes, table attributes, heading levels, and patterns.
6. **Do not hallucinate intent.** If unclear, ask on the PR. Do not guess.

## Forbidden Actions
- Do NOT rewrite entire Notion pages.
- Do NOT remove existing documentation unless the corresponding code was deleted.
- Do NOT update docs for pure refactors (changelog-only).
- Do NOT create new Notion pages. Only update the three existing documents.
- Do NOT make code changes. This playbook is documentation-only.

## Specifications
After this playbook completes:
- All Notion documents accurately reflect the current state of the codebase.
- No duplicate entries exist in any document.
- All formatting matches existing document conventions.
- A summary comment is posted on the PR.
