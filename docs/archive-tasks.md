# Archive Feature — Task List

Based on the architecture in `docs/archive-analysis.md`.

---

## Task 1: Archive Index Service

**Goal**: When a tournament is archived, write a lightweight metadata entry to `archive/{tid}` in Firebase RTDB.

### What to do

1. **Create `src/services/archive-index.js`** — new service with:
   - `writeEntry(tid, tournament, ownerUid, ownerEmail)` — writes index entry to `archive/{tid}`
   - `getAll()` — reads entire `archive/` node (returns object of all entries)
   - `getOne(tid)` — reads single entry
   - `remove(tid)` — deletes entry (used by deletion flow)

2. **Modify `src/services/archive-collaboration.js`** — in `addToSaved()`:
   - After successful archive status update, call `archiveIndexService.writeEntry()`
   - Extract metadata from tournament object to build the index entry
   - Index entry schema:
     ```js
     {
       name: tournament.name,
       nameLower: tournament.name.toLowerCase(),
       date: tournament.main?.games?.[0]?.[0]?.date || tournament.createdAt,
       system: tournament.main?.system,
       teamsCount: tournament.main?.teams?.length || 0,
       roundsPlayed: tournament.main?.games?.length || 0,
       ownerUid,
       ownerEmail,
       portalId: tournament.portalIdTournament || null,
       archivedAt: new Date().toISOString(),
       tournamentIsFinished: tournament.main?.tournamentIsFinished || false
     }
     ```

3. **Update `database.rules.json`** — add `archive` node rules:

   ```json
   "archive": {
     ".read": "auth.token.email === 'nemo15.alex@gmail.com'",
     "$tid": {
       ".write": "!data.exists() || (auth.token.email === 'nemo15.alex@gmail.com' && !data.child('portalId').exists()) || (auth.uid === data.child('ownerUid').val() && !data.child('portalId').exists())"
     }
   }
   ```

4. **Update `src/services/db.js`** — add `archiveIndexService` using same pattern as other services (ref-based CRUD on `archive/` path)

### Acceptance criteria

- Archiving a tournament writes an index entry to `archive/{tid}`
- Index entry contains all fields from the schema above
- Entry is ~200 bytes
- Super admin can read the entire `archive/` node
- Regular users cannot read `archive/` directly (they use their own `userTournamentMap`)
- Write-once enforced: existing entries cannot be overwritten (except delete by super admin/owner for non-portal)

### Files to modify/create

- `src/services/archive-index.js` (new)
- `src/services/archive-collaboration.js` (modify `addToSaved`)
- `src/services/db.js` (add service export)
- `database.rules.json` (add `archive` rules)

---

## Task 2: Deletion Policy

**Goal**: Restrict who can delete archived tournaments. Portal-imported tournaments are permanent. Non-portal ones deletable by super admin or owner only.

### What to do

1. **Add `isSuperAdmin` computed to store** (`src/stores/main.js`):

   ```js
   isSuperAdmin: (state) => state.user?.email === SUPER_ADMIN_EMAIL;
   ```

2. **Add `canDeleteArchived(tournament)` helper** (in archive-index service or a shared util):

   ```js
   function canDeleteArchived(tournament, userEmail, userUid) {
     if (tournament.portalId) return false;
     if (userEmail === SUPER_ADMIN_EMAIL) return true;
     if (userUid === tournament.ownerUid) return true;
     return false;
   }
   ```

3. **Modify `removeSavedTournament` in `archive-collaboration.js`**:
   - Before deleting, check `canDeleteArchived()`
   - If allowed: remove `archive/{tid}` index entry + remove `{ownerUid}/tournaments/{tid}` data + remove user map entries
   - If NOT allowed (collaborator): only remove their own `userTournamentMap` entry (hide from their view, don't touch data)
   - If tournament has portalId: reject entirely, show toast/error

4. **Update `src/views/Archived.vue`** — conditional delete button:
   - Hide delete button when `portalId` is set
   - Show delete button only when `isSuperAdmin || isOwner` (and no portalId)
   - For collaborators: show "Remove from my list" (calls hide-only flow)
   - Add confirmation dialog before actual delete

5. **Firebase rules already enforce this** (from Task 1 rules) — the `.write` rule on `archive/$tid` only allows deletion by super admin or owner when no portalId exists

### Acceptance criteria

- Portal-imported tournaments: no delete button visible, deletion rejected at DB level
- Super admin: can delete any non-portal tournament
- Owner: can delete their own non-portal tournament
- Collaborator: can only "remove from my list" (hides, doesn't delete data)
- Confirmation dialog before destructive delete
- Firebase rules enforce server-side (not just UI)

### Files to modify/create

- `src/stores/main.js` (add `isSuperAdmin` getter)
- `src/services/archive-index.js` (add `canDeleteArchived` helper)
- `src/services/archive-collaboration.js` (modify `removeSavedTournament`)
- `src/views/Archived.vue` (conditional buttons, confirmation dialog)

---

## Task 3: Super Admin Archive List UI

**Goal**: Enhanced `/archived` view that loads the archive index and renders a searchable, filterable list with virtual scroll. Lazy-loads full tournament data on click.

### What to do

1. **Modify `src/views/Archived.vue`** — super admin mode:
   - On mount: if `isSuperAdmin`, call `archiveIndexService.getAll()` and cache in store
   - Replace current sidebar list with new archive list component
   - List renders from index data (name, date, system, teamsCount) — NOT full tournament objects

2. **Create search/filter bar** (in Archived.vue or extracted component):
   - Text input: filters by `nameLower.includes(query)` or `date.includes(query)`
   - Dropdown: filter by `system` (swiss/groups/poules/supermele/tir)
   - All filtering is client-side computed property — instant, no network calls
   - Debounce search input at 150ms

3. **Virtual scroll for the list**:
   - Use `vue-virtual-scroller` package OR manual implementation with IntersectionObserver
   - Render only ~20 visible items at a time
   - Each item shows: name | date | system badge | teams count
   - Sorted by date descending (newest first) by default

4. **Lazy-load tournament on click**:
   - When user clicks a list item, fetch full data from `{ownerUid}/tournaments/{tid}` using existing `tournamentService.getOne(ownerUid, tid)`
   - Show loading skeleton while fetching
   - Display full tournament details in the right panel (existing functionality)
   - Cache loaded tournaments in store to avoid re-fetching on re-click

5. **Store additions** (`src/stores/main.js`):
   - `archiveIndex` state — object holding all index entries
   - `archiveIndexLoaded` — boolean flag
   - `fetchArchiveIndex()` action — calls `archiveIndexService.getAll()`, sets state
   - `loadArchivedTournament(tid, ownerUid)` action — fetches full data, caches

6. **Regular users** — unchanged flow:
   - They still use `fetchSavedTournaments()` (existing)
   - Same search/filter UI can apply to their list (filter `savedTournaments` client-side)

### Acceptance criteria

- Super admin sees all archived tournaments from all users in one list
- List loads in <200ms (60KB index read)
- Search by name: instant results as you type
- Filter by system: dropdown narrows the list
- Virtual scroll: DOM stays light with 300+ items
- Click tournament → shows full details (lazy-loaded)
- Regular users see only their own (unchanged behavior)

### Files to modify/create

- `src/views/Archived.vue` (major refactor — dual mode for super admin vs regular)
- `src/stores/main.js` (add `archiveIndex` state + actions)
- `package.json` (add `vue-virtual-scroller` if using it)

---

## Task 4: JSON Backup Cloud Function

**Goal**: When a tournament is archived (index entry written), a Cloud Function automatically saves the full tournament as a `.json` file to Cloud Storage.

### What to do

1. **Initialize Firebase Functions** (if not already):

   ```bash
   firebase init functions
   ```

2. **Create `functions/archive-backup.js`**:
   - Trigger: `onValueCreated` on `archive/{tid}`
   - Flow:
     1. Read `ownerUid` from the newly written index entry
     2. Read full tournament data from `{ownerUid}/tournaments/{tid}`
     3. Build backup JSON object:
        ```js
        {
          meta: {
            tournamentId: tid,
            archivedAt: entry.archivedAt,
            ownerUid: entry.ownerUid,
            ownerEmail: entry.ownerEmail,
            portalId: entry.portalId,
            appVersion: require('../package.json').version
          },
          tournament: fullTournamentData
        }
        ```
     4. Upload to Cloud Storage: `backups/{ownerUid}/{tid}.json`
     5. Update index entry: `archive/{tid}/backupExists = true`

3. **Cloud Storage bucket setup**:
   - Bucket name: `petanque-draw-backups` (or default Firebase Storage bucket)
   - Enable Object Versioning
   - Set retention policy: 365 days minimum
   - Lifecycle rule: transition to Coldline after 90 days

4. **Error handling in the function**:
   - If tournament data read fails → log error, set `archive/{tid}/backupError = true`
   - Retry policy: Firebase Functions auto-retry on failure (configure max retries = 3)
   - On success: log backup size and path

5. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

### Acceptance criteria

- Archiving a tournament automatically creates a `.json` backup file within ~5 seconds
- Backup contains complete tournament state (teams, games, playoff, cadrage, everything)
- `backupExists: true` is set on the archive index entry after success
- Backup file survives even if tournament is later deleted from RTDB
- Object Versioning prevents overwrite of existing backups

### Files to modify/create

- `functions/` directory (new — Firebase Functions project)
- `functions/index.js` (entry point)
- `functions/archive-backup.js` (backup logic)
- `functions/package.json` (dependencies)
- `firebase.json` (add functions config)
- `storage.rules` (bucket access rules)

### Prerequisites

- Firebase Blaze plan (required for Cloud Functions + Cloud Storage)
- `firebase-tools` CLI installed
- Cloud Storage bucket created

---

## Task 5: localStorage Visibility Toggle

**Goal**: Checkbox in archive header for super admin — "Show all users' tournaments". Stored in localStorage, default ON for super admin.

### What to do

1. **Add toggle to `src/views/Archived.vue`**:
   - Only visible when `isSuperAdmin`
   - Checkbox with label "Показати турніри всіх користувачів" / "Show all users' tournaments"
   - Reads/writes `localStorage.getItem('petanqueDrawArchiveShowAll')`
   - Default: `'true'` for super admin

2. **Behavior**:
   - When ON (default for super admin): list shows all tournaments from `archiveIndex`
   - When OFF: list filters to only show tournaments where `ownerUid === currentUser.uid` OR where user is in collaborators
   - Toggle change re-computes the filtered list instantly (reactive)

3. **Implementation**:
   ```js
   const showAll = ref(
     localStorage.getItem('petanqueDrawArchiveShowAll') !== 'false'
   )

   watch(showAll, (val) => {
     localStorage.setItem('petanqueDrawArchiveShowAll', String(val))
   })

   const visibleList = computed(() => {
     if (isSuperAdmin && showAll.value) return filtered.value
     return filtered.value.filter(t =>
       t.ownerUid === user.uid || /* check collaborator */
     )
   })
   ```

### Acceptance criteria

- Checkbox visible only for super admin
- Default state: ON (show all)
- Persists across sessions via localStorage
- Toggling instantly filters/unfilters the list
- Regular users never see this checkbox

### Files to modify

- `src/views/Archived.vue` (add checkbox + filtering logic)

---

## Task 6: Legacy Migration Script

**Goal**: One-time script to create `archive/{tid}` index entries for all currently archived tournaments (backfill).

### What to do

1. **Create `scripts/migrate-archive-index.js`** (Node.js script, run locally):
   - Authenticate as super admin (Firebase Admin SDK with service account)
   - Read all users from `users/` node
   - For each user, read their `tournaments/` map entries where `status: 'archived'`
   - For each archived tournament:
     - Read full tournament data from `{uid}/tournaments/{tid}`
     - Extract index metadata (name, date, system, teamsCount, etc.)
     - Write to `archive/{tid}`
   - Log progress: "Migrated {n}/{total} tournaments"

2. **Handle edge cases**:
   - Tournament data might be missing (orphaned map entry) → skip, log warning
   - Tournament might already have an `archive/{tid}` entry (idempotent — skip if exists)
   - `date` field: try `games[0][0].date`, fall back to `createdAt`

3. **Run once**:

   ```bash
   node scripts/migrate-archive-index.js
   ```

4. **Verify**: after migration, check `archive/` node count matches expected archived tournament count

### Acceptance criteria

- All existing archived tournaments get index entries
- Script is idempotent (safe to re-run)
- Handles missing data gracefully (logs, doesn't crash)
- Index entries match the schema from Task 1

### Files to create

- `scripts/migrate-archive-index.js` (new)
- `scripts/README.md` (document how to run, prerequisites)

### Prerequisites

- Firebase Admin SDK service account key
- Task 1 completed (archive index schema + rules in place)

---

## Execution Order

```
Task 1 (index service) ─────┐
                             ├──→ Task 3 (UI) ──→ Task 5 (toggle)
Task 2 (deletion policy) ───┘         │
                                      │
Task 6 (migration) ──────────────────┘  (run after Task 1 deployed)

Task 4 (Cloud Function backup) ── independent, do last (requires Blaze plan)
```

**Phase 1** (no billing changes): Tasks 1 + 2 → Task 3 → Task 5 → Task 6
**Phase 2** (Blaze plan required): Task 4

---

## Summary

| Task                          | Effort | Dependencies                | New packages                                  |
| ----------------------------- | ------ | --------------------------- | --------------------------------------------- |
| 1. Archive index service      | Low    | None                        | None                                          |
| 2. Deletion policy            | Low    | Task 1 (for `isSuperAdmin`) | None                                          |
| 3. Super admin list UI        | Medium | Tasks 1, 2                  | `vue-virtual-scroller` (optional)             |
| 4. JSON backup Cloud Function | Medium | Task 1, Blaze plan          | `firebase-functions`, `@google-cloud/storage` |
| 5. localStorage toggle        | Low    | Task 3                      | None                                          |
| 6. Legacy migration           | Low    | Task 1                      | `firebase-admin` (script only)                |
