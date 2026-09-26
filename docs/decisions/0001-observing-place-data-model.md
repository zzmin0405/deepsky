# Decision 0001: Observing Place Data Model

## Status

Accepted.

## Context

DeepSky recommends places for sky observation. A simple "weather is good here" answer is not enough because useful observing sites also depend on darkness, open sky, elevation, accessibility, and nearby light pollution.

The app currently needs to work both with MySQL configured and in local development without a populated database.

## Decision

Store objective observing-place facts as structured fields:

- Region and display names.
- Latitude and longitude.
- Elevation.
- Light-pollution indicators such as Bortle class and SQM.
- Openness and access scores.
- Short caution or recommendation notes.

Use MySQL `observing_places` through Prisma as the durable data source and keep a local fallback in `src/lib/server/observingPlaces.js` for development and demos.

Weather remains dynamic and should be fetched through the weather API/cache path. The LLM may explain why a place is good, but it should not be the only source of the underlying weather or place facts.

## Consequences

- New recommendation logic should rank candidates from structured data first.
- RAG-style text can be added later for rich descriptions, but numeric fields should stay queryable.
- If MySQL is unavailable, the app should still answer with fallback candidates instead of failing.
