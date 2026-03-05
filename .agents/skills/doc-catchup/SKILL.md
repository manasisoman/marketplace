# Doc Catchup Skill

This skill governs how Devin performs a one-time, full documentation catch-up for a
repository whose code has gotten ahead of its Notion documentation. Use this when
onboarding a repository or when a significant documentation gap has accumulated.

## When to Use This Skill

- A repository is being onboarded and has features with no corresponding Notion docs
- A team has shipped multiple releases without updating documentation
- A reviewer wants a complete audit of code vs. docs coverage

This skill is NOT for ongoing maintenance — use the `notion-doc-sync` and
`weekly-doc-batch` skills for that. This is a one-time bulk operation.

## Step 1: Full Codebase Audit

Perform a **complete** architecture derivation using the `app-architecture` skill
(`.agents/skills/app-architecture/SKILL.md`). Run all five steps:

1. **Tech stack identification** — Read all `package.json` files, identify frameworks,
   database, and frontend stack
2. **Data model discovery** — Find and extract all model/schema definitions with
   fields, types, relationships, constraints
3. **API endpoint discovery** — Find all route definitions with methods, paths,
   request/response shapes, middleware, auth
4. **Frontend structure discovery** — Map pages, components, navigation, state management
5. **Feature inventory** — Combine into a complete feature map where each feature is
   a coherent set of model(s) + endpoint(s) + component(s)

The output of this step is a **structured feature inventory** listing every feature
in the codebase with its constituent parts.

## Step 2: Gap Analysis

Compare the feature inventory from Step 1 against existing Notion documentation.

### 2a. Enumerate existing Notion pages
- List all pages in the Notion workspace under the documentation hierarchy
  (e.g., "Product Documentation", "API Reference", "Architecture" sections)
- For each page, note: title, parent page, last updated date, and a brief summary
  of what it covers

### 2b. Map features to Notion pages
For each feature in the inventory:
- Determine if an existing Notion page covers this feature (fully, partially, or not at all)
- Classify the coverage as:
  - **Documented** — a Notion page exists and appears to cover the current state of the feature
  - **Stale** — a Notion page exists but is outdated (missing new endpoints, models, or
    components that exist in code)
  - **Missing** — no Notion page or section covers this feature

### 2c. Classify each gap
For each **Stale** or **Missing** feature, classify the gap type:
- **API endpoint gap** — new or modified routes, query parameters, response shapes,
  or middleware that are not reflected in Notion docs
- **Non-API gap** — frontend/UI changes, customer experience changes, architecture
  changes, or feature behavior not reflected in Notion docs

A single feature may have both API and non-API gaps.

### 2d. Produce the gap report
Create a single **GitHub Issue** titled: "Documentation Catchup — Gap Report"

The Issue body should contain:
1. **Summary statistics:**
   - Total features found in code
   - Features fully documented / stale / missing
   - Total API endpoint gaps and non-API gaps

2. **Feature inventory table:**

   | Feature | Models | Endpoints | Components | Notion Status | Gap Type |
   |---------|--------|-----------|------------|---------------|----------|
   | Cart | Cart.js | POST /api/cart, GET /api/cart, ... | Cart.js | Stale | API |
   | Messaging | Message.js, Conversation.js | POST /api/messages, ... | Chat.jsx | Missing | API + Non-API |
   | ... | ... | ... | ... | ... | ... |

3. **Detailed gap descriptions** (one section per gap):
   - Feature name
   - What exists in code (models, endpoints, components — be specific)
   - What exists in Notion (page title, what it currently covers)
   - What is missing or outdated
   - Recommended action: update existing page or create new page
     (apply the Notion Page Creation Policy from `.agents/skills/notion-doc-sync/SKILL.md`)
   - If recommending a new page, include rationale per the policy

4. **Auto-apply notice:**
   "API endpoint gaps will be auto-applied to Notion immediately. Non-API gaps
   will be filed as separate GitHub Issues for review — comment `/approve-docs`
   on each to apply."

## Step 3: Batch Doc Generation

Process all gaps identified in Step 2. Handle API and non-API gaps differently.

### 3a. Auto-apply API endpoint gaps

For each API endpoint gap (new, modified, or undocumented endpoints):

1. Determine the target Notion page:
   - If an API Reference page exists for this feature area, update it
   - If no page exists, create one following the Notion Page Creation Policy
     (`.agents/skills/notion-doc-sync/SKILL.md`)
2. Draft the content using the **API Reference page template** from
   `.agents/skills/doc-standards/SKILL.md`:
   - Base URL, all endpoints with method/path/description/auth/params/response
   - Data model tables for related models
   - Change Log entry with today's date and "Documentation catchup — initial sync from code"
3. Apply the content to Notion:
   - Fetch current page content (if updating)
   - Apply updates following doc-standards formatting rules
   - If creating a new page, place under the appropriate parent (e.g., "API Reference")
4. Record what was applied (page title, URL, action taken) for the summary

### 3b. File Issues for non-API gaps (human review required)

For each non-API gap:

1. Determine the appropriate doc-standards template:
   - Feature behavior/requirements → **PRD page template**
   - System design/components/data flow → **Architecture Overview page template**
2. Optionally gather Slack context using the `weekly-doc-batch` skill's
   Slack Context Gathering rules (`.agents/skills/weekly-doc-batch/SKILL.md`):
   - Search suggested starting channels and dynamically discovered channels
   - Time window: 4 weeks (extended from the normal 2 weeks since this is a catchup)
   - Follow the same guardrails (cap at 5 channels per feature, skip unrelated channels)
   - Include any relevant Slack context in the Issue body
3. Create a GitHub Issue for each non-API gap (or group related gaps by feature area):
   - Title: "Doc Catchup — [Feature Name]: [Brief description of gap]"
   - Body contains:
     - The proposed Notion page content (fully drafted per the appropriate template)
     - Target Notion page (existing page URL if updating, or "New page under [parent]" if creating)
     - Slack context found (if any)
     - A note: "Comment `/approve-docs` to apply these changes to Notion."
   - Label the Issue with `doc-catchup` if the label exists (create it if not)

### 3c. Post summary on the gap report Issue

After all auto-applies are done and all review Issues are filed, post a comment
on the gap report Issue (from Step 2d) with:

1. **Auto-applied (API endpoint gaps):**
   - Count of Notion pages updated
   - Count of new Notion pages created
   - Links to all updated/created pages
   - Brief summary of each change

2. **Filed for review (non-API gaps):**
   - Count of GitHub Issues created
   - Links to each Issue
   - Brief summary of what each Issue proposes

3. **Coverage summary:**
   - Documentation coverage before catchup vs. after auto-apply
   - Remaining gaps pending review

## Error Handling

- If a Notion API call fails, log the error and continue with the next gap.
  Post a comment on the gap report Issue noting which pages could not be updated.
- If the codebase is too large to audit in a single pass, prioritize by:
  1. Backend models and API routes (these are the most critical for API docs)
  2. Frontend pages and key components
  3. Config and infrastructure files (lowest priority)
- If no Notion workspace access is available, stop after Step 2 (gap report) and
  note in the Issue that Notion access is required to proceed.

## Skills Referenced

- `.agents/skills/app-architecture/SKILL.md` — for Step 1 (full codebase derivation)
- `.agents/skills/notion-doc-sync/SKILL.md` — for Notion Page Creation Policy (Steps 2 and 3)
- `.agents/skills/doc-standards/SKILL.md` — for page templates and formatting (Step 3)
- `.agents/skills/weekly-doc-batch/SKILL.md` — for Slack context gathering (Step 3b)
