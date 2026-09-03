
Validation on the audited source:

- `mvn -f backend/pom.xml test`: 33 tests passed, including catalog, access control,
  financial behavior, concurrent stock changes, invalid invoice lines, and password boundaries.
- `node --test scripts/test-api-service.cjs`: 2 tests passed for API responses and CSV output.
- `git diff --check`: passed.

The automated backend tests use an isolated H2 database. Live MySQL/browser tests
were not run as part of this audit. Verify the assigned schedule with
`node scripts/verify-rebuilt-history.cjs` on the rebuilt branch.
