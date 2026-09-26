# Local Verification

## Standard Checks

Run these before handing off code changes:

```bash
npm run check
npm test
npm run build
```

Use `npm run check` for Svelte, route, server, and shared logic changes. Run `npm test` (Vitest) whenever server rules, question parsing, API routes, or components change; tests live next to the code as `*.test.js`, plus `tests/security.test.js` for security regressions. Use `npm run build` when route rendering, imports, or frontend layout changed. GitHub Actions runs all three on every push to `main` and on pull requests.

## Browser Checks

For visual or interaction changes:

1. Start the app with `npm run dev -- --host 127.0.0.1`.
2. Open `http://127.0.0.1:5173`.
3. Check the changed route, usually `/chatbot` or `/location`.
4. Click at least one suggested question or recommendation card.
5. Verify the UI remains readable on desktop width and no text overlaps.

## MySQL Checks

When changing database-backed behavior:

- Update `prisma/schema.prisma`, migrations, and `MYSQL_SCHEMA.md` together.
- Run `npm run db:generate` after changing Prisma models.
- Keep local observing-place fallback behavior working when MySQL is unavailable.
- Do not expose `DATABASE_URL` to client-side code.
