- `git diff --check`: passed.

The automated backend tests use an isolated H2 database. Live MySQL/browser tests
were not run as part of this audit. Verify the assigned schedule with
`node scripts/verify-rebuilt-history.cjs` on the rebuilt branch.
