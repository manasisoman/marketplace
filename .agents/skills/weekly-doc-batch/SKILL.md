# Weekly Doc Batch Skill

This skill governs how Devin processes batches of merged PRs on a weekly schedule
to generate documentation update proposals.

## Slack Context Gathering

### Suggested starting channels
Begin searching these channels as they typically contain the most relevant context:
- #product-decisions — PM decisions, feature scoping, customer feedback
- #engineering — Technical discussions, architecture decisions

### Dynamic channel discovery
Do NOT limit yourself to only the channels listed above. Use your judgment to search
additional Slack channels that may contain relevant context for the PR being processed:

1. Look at the PR author — search channels where that author has been active recently
2. Look at the project tracker ticket (Linear or Jira, if found) — search for the
   ticket key across all accessible channels
3. Look at the feature area — if the PR is about payments, search for channels with
   "payment", "billing", "finance" in their names
4. Look at recent threads — if a suggested channel contains a thread that references
   another channel, follow that lead
5. Search broadly first (by PR title keywords or ticket key across all channels),
   then narrow down to the most relevant threads

### Guardrails
- Time window: 2 weeks before the PR merge date (to keep context relevant)
- Do not search private channels you don't have access to (this will error — just skip)
- Do not search channels that are clearly unrelated (e.g., #random, #social, #lunch)
- If you find relevant context in an unexpected channel, note the channel name in the
  GitHub Issue so the team knows where the discussion happened
- Cap at 5 channels per PR to avoid excessive searching. If you find relevant threads
  in more than 5 channels, prioritize by relevance and recency.

## Linear Ticket Context Gathering

For each merged PR in the batch, gather customer context from associated Linear tickets.

**Requires** the `LINEAR_API_KEY` environment secret. If not available, skip this
entire section and note in each GitHub Issue: "Linear context unavailable —
LINEAR_API_KEY not configured."

### Correlation strategy (per PR)

Since the weekly batch already has the PR URL, correlation is more direct than in
the doc-catchup skill. Apply these methods in order, stopping once a ticket is found:

1. **PR attachment match (primary):** Query Linear for issues that have a GitHub
   attachment whose URL matches the PR being processed. This is the most reliable
   method and works when PRs are linked to tickets via Linear's GitHub integration
   or manual attachment.
2. **Branch name match (fallback):** Search Linear issue titles and descriptions
   for the PR's branch name (e.g., `feature/messaging-system`).
3. **PR title keyword search (last resort):** Search Linear issues by keywords
   from the PR title. Only use results where the match is clearly about the same
   feature — discard ambiguous matches.

### Extraction

For each correlated ticket, extract:
- Ticket identifier and title (e.g., "MAR-10: Messaging/Chat System")
- Customer names and quotes from the ticket description or comments
- Pain points, feature requests, and use cases mentioned
- Market sizing or business impact data if present
- Priority and status of the ticket

### Guardrails
- Cap at 5 tickets per PR (weekly batches deal with individual PRs, so this is
  tighter than the doc-catchup cap of 10 per feature)
- If a ticket contains potentially sensitive customer data (email addresses, phone
  numbers, account IDs), redact those fields and include only names, company names,
  and general feedback. The human review gate provides a final check.
- Do not include internal-only notes or comments marked as confidential
- If the Linear API returns errors or rate-limits, log the error and continue
  without Linear context rather than blocking the batch
- If rate-limited (HTTP 429), back off exponentially (1s, 2s, 4s) up to 3 retries
  per request, then skip and continue

## PR Grouping Rules

### Deriving the feature-to-file mapping
Do NOT rely on a hardcoded mapping of files to features. Instead, derive the mapping
dynamically at the start of each weekly batch run:

1. **Analyze the repository structure**: Read the directory tree, model files, route files,
   and frontend component files to understand what features exist
2. **Identify feature boundaries**:
   - Backend: Look at model files (each model often represents a feature domain),
     route groupings in server files (often separated by comments or router files),
     and controller/service directories
   - Frontend: Look at component directories, page components, and state management
     (e.g., state variables in App.js or store files)
3. **Build a mental map**: Before processing any PRs, construct a feature-to-file mapping
   for the current state of the repo. Example output (do not hardcode this — derive it):
   ```
   Cart feature: backend/models/Cart.js, cart routes in server.js, frontend/src/components/Cart.js
   Product feature: backend/models/Product.js, product routes in server.js, ProductCard.js, ProductGrid.js, ProductDetail.js
   ...
   ```
4. **Use this derived mapping** to group PRs: for each pending PR, check which files it
   modified and match them to the derived feature areas

### Grouping logic
- Group PRs that map to the same derived feature area into one GitHub Issue
- Max 5 PRs per GitHub Issue. If a group exceeds 5, split by backend/frontend.
- If a PR touches multiple feature areas, assign to the area with the most changed lines.
  Note cross-cutting nature in the issue.
- If a PR doesn't clearly fit any derived feature area, create a single-PR issue.
- If two PRs touch completely different areas with no overlap, they get separate issues
  even if the features seem conceptually related.

### Updating the mapping over time
The mapping is derived fresh each weekly run, so it automatically adapts as the
codebase evolves (new features added, files reorganized, etc.). There is no config
file to maintain.

## Weekly Batch Process

1. At the start of each weekly run, derive the app architecture and feature-to-file mapping
   (see app-architecture skill and PR Grouping Rules above)
2. List all PRs merged to main since the last batch run
3. For each PR, gather Slack context using the Slack Context Gathering rules above
4. For each PR, gather Linear ticket context using the Linear Ticket Context
   Gathering rules above
5. Group PRs by feature area using the derived mapping
6. For each group, create a GitHub Issue proposing the documentation updates
7. Include Slack context, Linear ticket context, PR summaries, and recommended
   Notion changes in each Issue. Format the Linear context as a
   **"Customer Context"** section:
   ```
   ## Customer Context (from Linear)

   **Related tickets:** MAR-10, MAR-15

   - **[Customer Name] at [Company]:** "[Quote or paraphrased feedback]"
     _(from [ticket ID], [priority])_
   - **Market impact:** [sizing data if available]
   - **Business justification:** [summary of why this feature was built]
   ```
   When multiple PRs in a group have Linear context, merge the customer context
   into a single section, deduplicating tickets that appear across multiple PRs.

## Prerequisites

- **LINEAR_API_KEY** — a Linear personal API key stored as an environment secret.
  Required for Linear Ticket Context Gathering. Generate one at
  https://linear.app/settings/api under "Personal API keys". If not available,
  the skill will skip Linear context and note it in the output.
- **Linear-GitHub integration** — for best results, PRs should be attached to
  Linear tickets. The correlation strategy includes fallbacks for repos where
  this isn't set up, but PR attachment matching is the most reliable method.
