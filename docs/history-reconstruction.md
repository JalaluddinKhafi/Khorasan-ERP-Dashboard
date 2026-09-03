# Reconstructed project history

This branch was reconstructed on **2026-11-08** at the repository owner's request.
The author and committer dates from 2026-04-30 through 2026-09-05 are an assigned
schedule, **not evidence that the work happened on those dates**. Every generated
commit records its original source commit in a `Source-Commit` trailer.

- Original main tip: `60660db` (369 reachable commits).
- Original history remains on `main`; audited source remains on `codex/audit-20261108`.
- Rebuilt branch: `codex/rebuilt-2026-apr-sep`.
- Schedule: 2,597 commits, 121 active days, 12–30 commits per active day, 8 idle days.
- Time zone: Asia/Kabul (`+04:30`), randomized times between 08:00 and 21:00.
- Random seed: `3907557154`; daily counts are in `history-schedule.csv`.

Changes follow the first-parent sequence of original file snapshots. Merged
changes are included when they enter that sequence; the merge graph is flattened.
Text changes are divided into smaller pieces; binary files and deletions stay
whole. No empty commits or filler changes are added to meet the count. Individual
partial commits can contain incomplete functions or markup and are not all
independently buildable. The final tree matches the audited source exactly.

The local `.codex-review/history-map.json` maps rebuilt commit IDs to source IDs.
The local `.codex-review/rebuild-history.cjs` contains the reconstruction process.
These review files are ignored by Git. No remote branch was changed or pushed.

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
