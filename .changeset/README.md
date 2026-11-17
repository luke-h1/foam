# Changesets

Each file in this directory is one release note. A pull request that changes
the app adds one with:

```sh
bun run changeset
```

Write one or two sentences for the person who uses the app. The bump type sets
the heading the note lands under:

| Bump    | Heading          |
| ------- | ---------------- |
| `major` | Breaking changes |
| `minor` | New              |
| `patch` | Fixed            |

A change with nothing to tell a user (a refactor, a test, CI) still has to pass
the check. Add an empty note:

```sh
bun run changeset -- --empty
```

The notes stay here until a production native build ships. The release job
then moves them into `CHANGELOG.md` under that version and deletes the files.
Nothing here changes a version number: `VERSION` in `app.config.ts` stays the
source of truth, because it is the EAS runtime version and a bump there cuts
installed builds off from OTA updates.

Preview the notes that are waiting:

```sh
bun run release:notes pending
```
