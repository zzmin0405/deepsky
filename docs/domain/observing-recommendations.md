# Observing Recommendations Domain Notes

## Core Concepts

- `observing_places`: MySQL table for candidate sky-observation places.
- Local fallback places: Development/demo candidates in `src/lib/server/observingPlaces.js`.
- `weather_cache`: MySQL table for cached weather observations and forecasts.
- Bortle class: Lower values generally mean darker skies.
- SQM: Sky brightness measurement in mag/arcsec2. Higher values generally mean darker skies.
- Openness score: Local heuristic for whether the horizon and sky view are open.
- Access score: Local heuristic for practical access and visitor friendliness.

## Recommendation Flow

1. Detect whether the user is asking for weather, an observing recommendation, or a location comparison.
2. Resolve candidate places from MySQL through Prisma; fall back to local candidates when MySQL is unavailable or empty.
3. Fetch or reuse weather rows for the candidate region.
4. Rank by a mix of current weather, cloud conditions, precipitation risk, light pollution, openness, elevation, and access.
5. Return compact cards plus a short natural-language explanation.

## Product Expectation

When the user asks "where is good today?", avoid recommending only a dense city center because the weather is clear. Prefer places that are darker, more open, and credible for observation. If the user asks about a specific place, answer as an evaluation: good points, blockers, and a better nearby alternative when possible.
