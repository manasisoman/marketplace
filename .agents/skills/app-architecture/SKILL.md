# App Architecture (Self-Derived)

This skill instructs Devin to derive the application architecture by analyzing the
repository. Do NOT rely on this document for specific file names, endpoints, or
data models — derive them fresh from the code.

## How to derive the architecture

When you need to understand the app architecture (e.g., for classification or
documentation purposes), analyze the repo as follows:

### 1. Tech stack identification
- Read `package.json` files (root, backend, frontend) for dependencies
- Identify the framework (Express, Next.js, etc.), database (Mongoose → MongoDB, Prisma → SQL, etc.),
  and frontend framework (React, Vue, etc.)
- Check for a proxy or gateway configuration (package.json proxy field, nginx config, docker-compose)

### 2. Data model discovery
- Find all model/schema files (e.g., `backend/models/*.js`, `prisma/schema.prisma`, `**/entities/*.ts`)
- For each model, extract: name, fields, types, required flags, relationships, defaults
- Note any special behaviors (timestamps, unique constraints, indexes)

### 3. API endpoint discovery
- Find route definitions (Express: `app.get/post/put/delete` or `router.*`, Next.js: `app/api/**/route.ts`)
- For each endpoint, extract: method, path, purpose, request body schema, response format
- Look for middleware, auth guards, validation logic

### 4. Frontend structure discovery
- Find page/view components and understand the navigation model (router-based, state-based, etc.)
- Identify the main state management approach (useState, Redux, Zustand, Context, etc.)
- List key components and their props to understand data flow

### 5. Feature inventory
- Combine the data models, endpoints, and frontend components into a feature map
- Each feature is a coherent set of: model(s) + endpoint(s) + component(s) that together
  deliver user-facing functionality

## When to derive
- **Weekly batch**: Derive the architecture at the start of each weekly run, before
  processing any PRs. This ensures the mapping reflects the current state of main.
- **Phase 1 (real-time)**: For individual PR classification, you may not need the full
  architecture — just read the files changed in the PR diff. But if classification is
  ambiguous, do a targeted derivation of the relevant feature area.

## Caching
You do not need to persist the derived architecture anywhere. Derive it fresh each
session. The repo is the source of truth, not this document.
