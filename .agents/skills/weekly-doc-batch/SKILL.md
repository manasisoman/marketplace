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
2. Look at the Jira ticket (if found) — search for the ticket key across all accessible channels
3. Look at the feature area — if the PR is about payments, search for channels with
   "payment", "billing", "finance" in their names
4. Look at recent threads — if a suggested channel contains a thread that references
   another channel, follow that lead
5. Search broadly first (by PR title keywords or Jira key across all channels),
   then narrow down to the most relevant threads

### Guardrails
- Time window: 2 weeks before the PR merge date (to keep context relevant)
- Do not search private channels you don't have access to (this will error — just skip)
- Do not search channels that are clearly unrelated (e.g., #random, #social, #lunch)
- If you find relevant context in an unexpected channel, note the channel name in the
  GitHub Issue so the team knows where the discussion happened
- Cap at 5 channels per PR to avoid excessive searching. If you find relevant threads
  in more than 5 channels, prioritize by relevance and recency.

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
3. For each PR, gather Slack context using the rules above
4. Group PRs by feature area using the derived mapping
5. For each group, create a GitHub Issue proposing the documentation updates
6. Include Slack context, PR summaries, and recommended Notion changes in each Issue
