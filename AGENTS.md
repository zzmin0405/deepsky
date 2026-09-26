# DeepSky Agent Guide

## Project Shape

DeepSky is a SvelteKit weather and observing assistant for Korean sky-watching use cases.
The app combines:

- KMA weather lookups through SvelteKit API routes.
- A chatbot UI that can answer weather and observing questions.
- MySQL/Prisma-backed observing place data, with local fallback data for development.
- Gemini-compatible LLM responses for natural language phrasing, with deterministic fallbacks when the LLM is unavailable.

Preserve the current SvelteKit structure. Do not replace the app with a generic starter-kit layout.

## Local Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev -- --host 127.0.0.1`
- Type and Svelte checks: `npm run check`
- Unit tests (Vitest): `npm test`
- Production build: `npm run build`

The app uses Svelte 5 runes (`$state`, `$derived`, `$props`). Write new components in runes mode and keep reusable UI in `src/lib/components`.

For frontend changes, verify the relevant route in the in-app browser at `http://127.0.0.1:5173`.

## Data And API Rules

- Keep Prisma models, migrations, and `MYSQL_SCHEMA.md` in sync with table changes.
- Weather data should come from the weather API/cache path. Do not fabricate current weather.
- Observing recommendations should use structured place data from MySQL or the local fallback in `src/lib/server/observingPlaces.js`.
- Raw extracted light-pollution samples live in `data/light-pollution-samples.json`.
- Use LLM output for explanation and ranking language, not as the only source of required weather or place facts.
- If LLM quota or network calls fail, preserve a useful deterministic response instead of returning a hard chatbot failure.

## Safety Rails

- Never commit `.env` or `.env.local`.
- Do not edit generated folders such as `.svelte-kit`, `build`, or `node_modules`.
- Do not remove unrelated local changes. This project often has active work-in-progress files.
- Keep UI copy in Korean unless there is a clear reason to change language.
- When adding new external services, document required environment variables and fallback behavior.

## Verification Checklist

Run the smallest checks that match the change:

- Server, data, or shared logic: `npm run check` and `npm test`
- Build-sensitive routing or Svelte changes: `npm run build`
- Chatbot/weather/location UX: browser test the affected route and click at least one suggested question or recommendation card.
