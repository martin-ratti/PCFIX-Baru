# AGENTS.md

## Setup commands

- **Install deps**: `npm install` (root)
- **Start dev server**:
    - API: `cd packages/api && npm run dev`
    - Web: `cd packages/web && npm run dev`
- **Run tests**:
    - API: `cd packages/api && npm test`
    - Web (Unit): `cd packages/web && npm test`
    - Web (E2E): `cd packages/web && npx playwright test`
- **Database**:
    - Push schema: `cd packages/api && npx prisma db push`
    - Studio: `cd packages/api && npx prisma studio`

## Code style

- **Language**: TypeScript (Strict mode).
- **Frontend**: Astro 5 (SSR), React 18, Tailwind CSS.
- **Backend**: Express.js 5, Prisma 6, PostgreSQL.
- **Architecture**: Monorepo with NPM Workspaces.
    - `packages/api`: Modular architecture (Controllers, Services, Repositories).
    - `packages/web`: Feature-based folders in `src/components`.
- **Conventions**:
    - Use Functional Components in React.
    - Prefer `async/await` over callbacks.
    - Use Zod for validation (shared schemas).
    - Use Lucide React for icons.

## Project Structure

- **packages/api/src/modules**: Business logic grouped by feature (e.g., `auth`, `products`, `sales`).
- **packages/web/src/pages**: File-based routing for Astro.
- **packages/web/src/components**: React components and Astro islands.
