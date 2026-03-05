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

### Auto-apply (API endpoint changes)
When the PR contains API endpoint changes (new/modified routes, query parameters,
response shapes, middleware in backend route files), Phase 2 runs automatically
in the same Devin session as Phase 1. After posting the classification comment:
1. Immediately proceed to fetch the current content of the target Notion page(s)
2. Apply the updates following the doc-standards skill conventions
3. If the Notion Page Creation Policy calls for a new page, create it
4. Post a follow-up comment on the PR confirming the changes were applied,
   with links to the updated/created Notion pages

### Deferred to weekly batch (non-API changes)
When the PR contains non-API changes (frontend/UI, customer experience, config,
tooling, etc.), Phase 2 is NOT triggered in real time. Instead:
1. The classification comment ends with a note:
   "Non-API change — documentation updates will be addressed in the next
   weekly batch run."
2. The weekly-doc-batch process picks up this PR along with other merged PRs,
   gathers Slack context, groups related PRs, and proposes documentation
   updates via GitHub Issues for reviewer approval.

### Manual approval via `/approve-docs`
The `approve-docs.yml` workflow provides a manual override for any PR or Issue.
When a reviewer comments `/approve-docs`:
1. A new Devin session is triggered to apply the proposed documentation changes
2. Devin reads the classification from the PR/Issue comments, applies all
   proposed changes, and posts a confirmation comment
This can be used to expedite non-API changes that shouldn't wait for the weekly
batch, or to trigger updates on weekly batch Issues after review.

## Slack Approval Monitor

Monitor the designated Slack channel for approval signals on documentation changes.
When a reviewer approves changes in the GitHub Issue or PR, proceed with applying
the documentation updates to Notion.
