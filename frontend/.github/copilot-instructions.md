# Copilot Instructions for GeoAngola Frontend

## Build, test, and lint

Run commands from the repository root:

- Install dependencies: `make setup` or `pnpm install`
- Develop: `make dev` or `pnpm dev`
- Build: `make build` or `pnpm build`
- Start production: `make start`
- Lint: `make lint` or `pnpm lint`
- Format: `make format`
- Check formatting: `make format-check`
- Final checks: `make check` (format-check, lint, build)

There is no configured test runner or `test` script, so there is no single-test command yet.

## Architecture

This is a Next.js 16 App Router frontend for GeoAngola. The backend API runs separately; this repository only configures and consumes it.

- `app/` owns routes and layouts. `app/layout.tsx` composes the React Query provider, auth provider, global fonts, and the single Sonner toaster.
- `services/api.ts` is the shared Axios client. Set `NEXT_PUBLIC_API_URL` to the backend API URL and optionally set `NEXT_PUBLIC_API_TIMEOUT`.
- `services/auth.ts` contains example auth requests. Adapt its request/response types and endpoints to the actual backend contract.
- `hooks/useFetch.ts` wraps TanStack Query for GET requests; it accepts an optional `queryKey`, `enabled`, and Axios `params`, and passes the query cancellation signal to Axios.
- `contexts/AuthContext.tsx` provides client-side session state. Auth models in `types/auth.ts` are explicitly examples, not a specification of the backend.
- `schemas/` holds Zod schemas; `hooks/useForm.ts` connects them to React Hook Form and Sonner.
- `components/ui/`, `components/form/`, and `components/table/` contain reusable UI primitives and helpers. Use `cn()` from `lib/utils.ts` to merge Tailwind classes.

## Repository conventions

- Use `@/` aliases for project-local imports.
- Keep API access in `services/`, not in route components.
- `ApiResponse<T>` is a starter envelope only; update it and any pagination types to match the real API.
- Use `utils/storage.ts` and `STORAGE_KEYS` for browser session storage rather than accessing `localStorage` directly in components.
- The login page currently has placeholder submission behavior; do not present it as a working authentication flow.
- Tailwind CSS v4 is imported in `app/globals.css`; shadcn aliases are defined in `components.json`.
