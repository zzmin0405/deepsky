# Harness Adoption Report

## Source

Reference kit: `baskduf/harness-starter-kit`

Adoption style: minimal, project-specific harness. The SvelteKit app structure was preserved.

## Added

- `AGENTS.md` with project-specific agent instructions, safety rails, and verification commands.
- `docs/decisions/0001-observing-place-data-model.md` to record the recommendation data-model decision.
- `docs/domain/observing-recommendations.md` to capture the product/domain model.
- `docs/conventions/local-verification.md` to make local checks explicit.
- `docs/failures/gemini-quota-weather-fallback.md` to preserve a known failure and guardrail.
- `.gitignore` entry for the local `harness-starter-kit/` reference clone.

## Skipped

- No package scripts were changed.
- No CI workflow was added.
- No generic starter-kit application files were copied into the app.

## Effectiveness Plan

For the next few chatbot, weather, or location-recommendation changes, compare against the pre-harness workflow:

- Did `npm run check` and `npm run build` pass before handoff?
- Did the change preserve deterministic fallback behavior when the LLM is unavailable?
- Did observing recommendations avoid the previous "clear weather in a dense city center" failure mode?
- Did the developer update the Prisma migration and `MYSQL_SCHEMA.md` when table shape changed?

If the same mistake repeats, add a short failure note under `docs/failures/` instead of relying on memory.

## Local Reference Clone

`harness-starter-kit/` is kept only as a local reference and is ignored by Git. Remove it later if it is no longer useful.
