# Failure Memory: LLM Quota Should Not Break Weather Chat

## Symptom

The chatbot can fail or become unhelpful when a free-tier LLM provider returns a quota or rate-limit error.

## Lesson

Weather and observing recommendations need deterministic fallback responses. The LLM should improve phrasing and explanation, but required user-facing answers should still work from weather API data, cached rows, and structured observing-place data.

## Guardrail

When editing chatbot routes, keep provider errors isolated and return a useful fallback message with available weather/place facts.

