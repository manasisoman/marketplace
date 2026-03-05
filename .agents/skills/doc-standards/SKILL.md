# Documentation Standards Skill

This skill defines the formatting conventions and structure that Devin must follow
when writing or updating Notion documentation pages. These standards ensure consistency
across all documentation produced by the doc sync system.

## General Formatting Rules

### Headings
- Use H1 (`#`) only for the page title — one per page
- Use H2 (`##`) for major sections (e.g., "Overview", "API Endpoints", "Data Model")
- Use H3 (`###`) for subsections within a major section
- Never skip heading levels (e.g., don't go from H1 to H3)

### Writing style
- Use clear, concise language — prefer short sentences over long ones
- Write in present tense ("The cart stores items" not "The cart will store items")
- Use active voice ("The API returns a list" not "A list is returned by the API")
- Avoid jargon unless it's domain-specific terminology the team uses
- Define acronyms on first use in each page

### Lists
- Use bullet lists for unordered items (features, notes, considerations)
- Use numbered lists for sequential steps (setup instructions, workflows, processes)
- Keep list items parallel in structure (all start with verbs, or all are noun phrases)

### Code references
- Use inline code (`backticks`) for file names, function names, variable names,
  endpoint paths, and CLI commands
- Use code blocks with language hints for multi-line code examples:
  ```javascript
  // example
  ```
- Always specify the language for syntax highlighting

## Page Structure Templates

### PRD (Product Requirements Document) page
```
# Feature Name

## Overview
Brief description of what this feature does and why it exists.

## User Stories
- As a [user type], I want to [action] so that [benefit]

## Functional Requirements
### [Sub-feature 1]
- Requirement details

### [Sub-feature 2]
- Requirement details

## Technical Notes
Implementation details relevant to understanding the feature.

## Change Log
| Date | PR | Change Summary |
|------|-----|----------------|
| YYYY-MM-DD | #123 | Description of change |
```

### API Reference page
```
# API: [Service/Feature Name]

## Base URL
`/api/[resource]`

## Endpoints

### GET /api/[resource]
**Description:** What this endpoint does
**Auth required:** Yes/No
**Request params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|

**Response:**
- `200 OK` — Success response shape
- `4xx/5xx` — Error cases

### POST /api/[resource]
(same structure)

## Data Model
### [Model Name]
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
```

### Architecture Overview page
```
# Architecture: [System/Feature Name]

## Overview
High-level description of how this system works.

## Components
### [Component 1]
- Purpose
- Key files
- Dependencies

## Data Flow
Description or diagram of how data moves through the system.

## Dependencies
External services, databases, or APIs this system depends on.
```

## Change Log Conventions

Every documentation update must append to the Change Log table at the bottom of the
affected page:

| Date | PR | Change Summary |
|------|-----|----------------|
| YYYY-MM-DD | #123 | Brief description of what changed |

- Use the PR merge date as the Date
- Link the PR number to the actual GitHub PR
- Keep the summary to one line — reference the PR for details

## Cross-Referencing

- When one Notion page references concepts documented on another page, add an inline
  link: "See [Feature Name](link-to-notion-page) for details"
- When a PR touches multiple features, update all affected pages and cross-reference
  the related changes

## Content Scope

### Include in documentation
- Feature behavior and purpose (what it does, why)
- API contracts (endpoints, request/response shapes, error codes)
- Data models (fields, types, relationships, constraints)
- Configuration and environment variables
- Architecture decisions and their rationale (from Slack/PR context)
- Known limitations or edge cases

### Do NOT include in documentation
- Implementation details that change frequently (line numbers, internal variable names)
- Debugging steps or temporary workarounds
- Personal opinions or commentary
- Raw code dumps without explanation
- Sensitive information (API keys, secrets, credentials)

## Tone and Audience

Write for a technical audience that includes:
- Engineers joining the team who need to understand the system
- PMs reviewing feature completeness against requirements
- The future version of the team that has forgotten why something was built this way

Assume the reader has general software engineering knowledge but no prior context
about this specific codebase.
