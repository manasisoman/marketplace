# Notion Doc Sync Skill

This skill governs how Devin synchronizes documentation to Notion based on merged PRs.

## Notion Page Creation Policy

Devin may create new Notion pages when necessary, using the following judgment criteria:

**CREATE a new page when:**
- A merged PR introduces a net-new feature that has no existing Notion page or section
  (e.g., a completely new module like "Messaging" or "Payments" that doesn't fit under any existing page)
- The existing page structure cannot accommodate the new content without breaking
  the document's logical organization (e.g., a new feature area that would be
  confusingly buried under an unrelated parent section)
- A new API service or microservice is introduced that warrants its own API Reference page

**DO NOT create a new page when:**
- The content can be added as a new subsection under an existing page
  (e.g., a new cart feature goes under the existing PRD's "Cart" section)
- The content is minor (a small bug fix, config change, or incremental feature improvement)
- A similar page already exists that could be extended

**When creating a new page:**
- Place it under the appropriate parent page in the Notion workspace hierarchy
  (e.g., new feature PRD pages go under "Product Documentation", new API pages go under "API Reference")
- Follow the structure and formatting conventions of existing sibling pages
- Note the page creation in the GitHub Issue or PR comment so reviewers are aware:
  "Created new Notion page: <page title> under <parent page>"

**For review-required changes:** If Devin determines a new page is needed during the
weekly batch process, include this recommendation in the GitHub Issue body with a
callout: "⚠️ Recommending new Notion page: <title> — <reason>". The page should
still be created as part of the proposed changes, but the reviewer should be made
aware since new pages affect the documentation structure.

## Phase 1: Real-Time PR Classification

When a PR is merged to main:
1. Read the PR diff to understand the scope of changes
2. Classify the change by feature area (derive this from the code, not a hardcoded list)
3. Determine which Notion page(s) need updating based on the feature area
4. Apply the Notion Page Creation Policy above to decide whether to update existing pages or create new ones
5. Post a classification comment on the PR with the proposed Notion changes

## Phase 2: Applying Documentation Updates

Phase 2 is triggered differently depending on the type of change identified
during classification:

### Auto-apply (API endpoint changes only)
When the PR contains API endpoint changes (new/modified routes, query parameters,
response shapes, middleware in backend route files), auto-apply **only the API
endpoint documentation** in the same Devin session as Phase 1. After posting the
classification comment:
1. Immediately proceed to fetch the current content of the target Notion page(s)
2. Apply **only** the API endpoint updates (e.g., API Reference sections, endpoint
   descriptions, request/response shapes, endpoint-specific data model tables)
   following the doc-standards skill conventions
3. If the Notion Page Creation Policy calls for a new page, create it
4. Post a follow-up comment on the PR confirming which API changes were applied,
   with links to the updated/created Notion pages

### Deferred non-API changes (file GitHub Issues)
When the PR contains non-API changes (PRD feature stories, functional requirements,
TDD model schemas, TDD architecture sections, frontend/UI component documentation,
customer experience, config, tooling, etc.), those changes are **never** auto-applied
to Notion — even if the same PR also contains API endpoint changes. Instead:
1. Create GitHub Issues for the non-API documentation changes, grouped by feature
   area. Each Issue should contain:
   - Title: "Doc Update — [Feature Name]: [Brief description]"
   - The proposed Notion content (fully drafted per doc-standards templates)
   - Target Notion page (existing page URL or "New page under [parent]")
   - A note: "Comment `/approve-docs` to apply these changes to Notion."
2. Include a summary in the PR comment listing the GitHub Issues created.
3. The weekly-doc-batch process may also pick up these PRs to gather additional
   Slack context and group related changes.

### Mixed PRs (both API and non-API changes)
A single PR often contains both API and non-API changes (e.g., a new feature PR
that adds routes, models, PRD requirements, and frontend components). In this case:
1. **Split** the documentation updates into API and non-API portions
2. **Auto-apply** only the API endpoint documentation to Notion
3. **File GitHub Issues** for all non-API documentation (PRD, TDD, frontend, etc.)
4. Post a PR comment that clearly lists:
   - What was auto-applied to Notion (API docs only)
   - Links to the GitHub Issues created for non-API docs pending review

### Manual approval via `/approve-docs`
The `approve-docs.yml` workflow provides a manual override for any PR or Issue.
When a reviewer comments `/approve-docs`:
1. A new Devin session is triggered to apply the proposed documentation changes
2. Devin reads the classification from the PR/Issue comments, applies all
   proposed changes, and posts a confirmation comment
3. If the target is a GitHub Issue (not a PR), Devin closes the Issue after
   successfully applying all changes, with a closing comment confirming
   completion
This can be used to expedite non-API changes that shouldn't wait for the weekly
batch, or to trigger updates on weekly batch Issues after review.

## Slack Approval Monitor

Monitor the designated Slack channel for approval signals on documentation changes.
When a reviewer approves changes in the GitHub Issue or PR, proceed with applying
the documentation updates to Notion.
