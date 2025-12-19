# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookSmart is an AI-powered bookmark manager built as a React SPA with Supabase backend. Currently in **Phase 1: Foundation (71% complete)** - using localStorage for storage (database migration pending).

## Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:5173)
pnpm build            # TypeScript check + Vite build
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # ESLint across all workspaces
pnpm type-check       # TypeScript type checking
```

Web app specific commands (from `apps/web/`):
```bash
pnpm dev              # vite
pnpm build            # tsc -b && vite build
pnpm lint             # eslint .
pnpm type-check       # tsc --noEmit
```

## Architecture

### Monorepo Structure (pnpm workspaces)
```
apps/web/src/
├── components/       # React components
│   ├── ui/          # Shadcn/ui primitives (button, card, dialog, input, badge, etc.)
│   ├── AddBookmarkDialog.tsx    # Two-mode bookmark intake (URL or Text)
│   ├── EditBookmarkDialog.tsx   # Bookmark editor
│   ├── BoardManagementDialog.tsx
│   ├── FolderManagementDialog.tsx
│   └── Auth.tsx
├── contexts/         # React Context (AuthContext)
├── hooks/           # Custom hooks (useAuth)
├── lib/             # Core utilities
│   ├── supabase.ts  # Supabase client + TypeScript types
│   ├── storage.ts   # localStorage wrapper with caching (primary data layer currently)
│   ├── ai.ts        # Claude API client (analyzeBookmarkWithAI - exists but not wired to UI)
│   ├── metadata.ts  # URL metadata extraction via corsproxy.io
│   └── utils.ts     # General utilities (cn for classnames)
└── pages/
    └── Dashboard.tsx # Main app view (1500+ LOC, manages bookmarks/boards/folders)
```

### Data Flow
- **Current**: localStorage with 5-minute cache TTL, pagination (20 items/page)
- **Planned**: Supabase PostgreSQL + pgvector for embeddings

### Key Patterns
- **State**: React Context for auth, component state for UI
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Performance**: Infinite scroll, board prefetching on hover, lazy image loading

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Shadcn/ui |
| Backend | Supabase (Auth, planned: DB, Storage) |
| AI | Claude 3.5 Sonnet (Anthropic), Voyage AI (embeddings, planned) |
| Deployment | Vercel |

## Environment Variables

Required in `.env` (see `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=     # Optional: for AI features
VITE_VOYAGE_API_KEY=        # Optional: for embeddings
VITE_APP_URL=http://localhost:5173
```

## Implementation Status

**Working**: Authentication (email/password + Google OAuth), bookmark saving (URL/text), URL metadata fetching, dashboard UI with boards/folders/categories, performance optimizations

**Partial**: AI integration (code exists in `lib/ai.ts` but not called from UI)

**Not Started**: Database migration, semantic search, browser extension, mobile app, discovery feed

See `FEATURES_COVERAGE.md` for detailed status.

## Key Files for Common Tasks

- **Add bookmark feature**: `components/AddBookmarkDialog.tsx`
- **Dashboard/display**: `pages/Dashboard.tsx`
- **Data operations**: `lib/storage.ts` (localStorage CRUD with caching)
- **AI integration**: `lib/ai.ts` (Claude API, ready to wire)
- **Auth flow**: `hooks/useAuth.tsx`, `contexts/AuthContext.tsx`
- **Supabase types**: `lib/supabase.ts` (Database interface definitions)
