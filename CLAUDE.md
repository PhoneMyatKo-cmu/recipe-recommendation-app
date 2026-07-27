# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

RecipeFinder — the React + TypeScript + Vite frontend for an Information Retrieval course project. It talks to a separate FastAPI backend (a recipe search/RAG service) that must be running locally. This repo is frontend-only.

## Commands

```bash
npm run dev          # Vite dev server (HMR)
npm run build        # tsc -b type-check, then vite build
npm run lint         # ESLint over the repo
npm run test         # vitest run (one-shot)
npm run test:watch   # vitest watch mode
```

Run a single test file:

```bash
npx vitest run src/test/unit/imageUrl.test.ts
```

There is no separate typecheck script — `npm run build` runs `tsc -b`. Vitest is configured inside `vite.config.ts` (`test.environment: "node"`, `globals: true`), so tests run in a Node environment, not jsdom — unit tests here cover pure utility functions, not component rendering.

## Backend dependency

Every page calls a backend hardcoded as `const API_BASE_URL = 'http://127.0.0.1:8000'`. This constant is **duplicated in each file** that makes requests (`App.tsx`, all pages, `utils/imageUrl.ts`, `RecipeDetailModal.tsx`) rather than centralized — change it everywhere if the backend URL moves. Without the backend running on port 8000, the app renders but all data operations fail.

Key backend endpoints in use: `/auth/{register,login,logout}`, `/users/me`, `/search`, `/rag/ask`, `/recommendations/{all,popular,random}`, `/folders`, `/folders/{id}/recommendations`, `/bookmarks`, `/recipes/{id}`, `/image-proxy/image-proxy`, `/evaluate`.

## Architecture

**Routing is hand-rolled, not react-router.** `App.tsx` is the single source of navigation truth:
- It reads `window.location.pathname` into state and listens for `popstate`.
- `navigate(path)` calls `window.history.pushState` and updates the `pathname` state.
- The rendered page is chosen by an if/else ladder on `pathname` (see the `authenticatedPage` block). Folder detail routes are matched with `getFolderIdFromPath` against `/folders/:id`.
- When adding a route: add a nav item, a branch in the ladder, and (if it takes an id) a path-matching helper.

**Auth is token-in-localStorage.** The token lives in `localStorage['auth_token']`, mirrored into React state. `isAuthenticated` gates the whole app: unauthenticated users are force-navigated to `/register`/`/login` and see `AuthPage`; authenticated users see the nav header + page. `extractToken` accepts `access_token`/`token`/`bearer_token` from the login response. Each page receives `token` as a prop and attaches `Authorization: Bearer ${token}` manually per fetch.

**Global fetch is monkey-patched** in `App.tsx` to intercept `401` responses on non-auth routes, clear the token, and redirect to `/login` (session-expiry handling). Be aware this wrapper is active for all `window.fetch` calls.

**Data fetching is local to each page** — no global store, no data-fetching library. Each page/component owns its own `useState` for `isLoading`/`error`/data and calls `fetch` directly in effects or handlers. The consistent error pattern is a `getErrorMessage(response, fallback)` helper that reads `data.detail` from the backend's error JSON.

### Directory layout
- `src/pages/` — one component per route (`SearchPage`, `RagPage`, `LandingPage`, `Folder`, `FolderDetail`, `AllBookmarks`, `AuthPage`, `EvaluatePage`).
- `src/components/shared/` — reusable `RecipeCard` (variants: `compact`/`full`/`minimal`) and `RecipeCardSkeleton`.
- `src/components/search/` — search-specific pieces including `RecipeDetailModal` and `SearchBar`. Note there is **both** a `components/shared/RecipeCard.tsx` and a `components/search/RecipeCard.tsx`; confirm which one you're editing (pages import the shared one).
- `src/utils/` — pure helpers, the only unit-tested code.

### Image handling
Backend recipe image URLs are dirty (embedded quotes, Cloudinary transform segments, trailing junk). `utils/imageUrl.ts` `normalizeImageUrl` cleans them and `toProxyImageUrl` wraps them through the backend `/image-proxy/image-proxy` endpoint (to dodge CORS/hotlinking). Always render remote recipe images through `toProxyImageUrl`, with a fallback to `DEFAULT_IMAGE` in `RecipeCard` on error.

## Conventions
- Styling is Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — configured through the Vite plugin). The app's visual identity is an amber/orange gradient theme.
- Exported pure functions (`extractToken`, `getFolderIdFromPath`, `normalizeImageUrl`, `stripWrappingQuotes`) are exported specifically so they can be unit-tested; keep new testable logic as exported pure functions in `utils/` or alongside `App`.
