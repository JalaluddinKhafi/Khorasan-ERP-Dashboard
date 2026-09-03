
## Code audit and fixes

This was a targeted review of login, authorization, invoice input, and shared
frontend request/export helpers, not a complete security certification.

| Finding | Change |
| --- | --- |
| Password character limits did not enforce BCrypt's 72-byte UTF-8 limit. | Share password validation between initial admin creation and user changes; reject oversized Dari passwords before encoding. Preserve entered password whitespace when setting a password. |
| Null or non-object invoice lines could throw an internal Java exception. | Reject malformed lines as invalid input before processing products or stock. |
| The API helper treated malformed successful JSON as an empty success. | Report an invalid response, keep 204 success handling, and handle null error bodies safely. |
| CSV formula protection missed formulas after leading whitespace. | Prefix dangerous cells before CSV quoting, including leading tab/newline cases. |

Validation on the audited source:

- `mvn -f backend/pom.xml test`: 33 tests passed, including catalog, access control,
  financial behavior, concurrent stock changes, invalid invoice lines, and password boundaries.
- `node --test scripts/test-api-service.cjs`: 2 tests passed for API responses and CSV output.
- `git diff --check`: passed.

The automated backend tests use an isolated H2 database. Live MySQL/browser tests
were not run as part of this audit. Verify the assigned schedule with
`node scripts/verify-rebuilt-history.cjs` on the rebuilt branch.
