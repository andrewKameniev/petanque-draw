# Tournament Archive Architecture Analysis

## Current State

### How It Works Today

Archiving is a **metadata flag flip**, not a data move. When a tournament is archived:

1. `users/{uid}/tournaments/{tid}.status` changes from `'active'` to `'archived'`
2. Tournament data stays at the **same Firebase path**: `{uid}/tournaments/{tid}`
3. The UI filters the list — active tournaments go to the main view, archived ones to `/archived`

There is no separate "archive database", no backup, no redundancy. The archived tournament is the same object in the same location — just tagged differently.

---

## Risk Assessment

### Single Point of Failure: Firebase Realtime Database

| Risk | Impact | Likelihood | Mitigation Today |
|------|--------|------------|------------------|
| Accidental deletion via UI | Tournament lost forever | Medium (delete button exists in archive view) | None — no soft delete, no confirmation beyond browser |
| Accidental deletion via code | Multiple tournaments lost | Low | None |
| Firebase data corruption | All data lost | Very Low | Firebase has automatic daily backups (Blaze plan) |
| Firebase account compromise | All data lost/ransomed | Low | Standard Firebase Auth only |
| Owner deletes account | All their tournaments gone | Low | None — data lives under `{uid}/tournaments/` |
| Collaborator data inconsistency | Shared tournaments orphaned | Medium | `watchCollaboratorAccess()` handles revocation but not owner deletion |

### What's Protected

- **Read access**: Database rules restrict `/saved/` and `/userMap/` to owner only
- **Write access**: Collaborators can only write to tournament data paths, not delete the root node
- **Route protection**: `/archived` requires Firebase Auth
- **Real-time sync**: Changes propagate to collaborators immediately

### What's NOT Protected

- **No backup mechanism** — if Firebase data is gone, it's gone
- **No export/snapshot** — no way to download a tournament as JSON/PDF for offline storage
- **No soft delete** — `removeSavedTournament()` calls `tournamentService.remove()` which is a hard delete
- **No versioning** — no history of tournament state changes
- **No separate archive storage** — archived data shares the same DB node and quota as active data
- **No data integrity validation** — no checksums, no schema validation on read
- **No disaster recovery plan** — no documented restore procedure

---

## Architecture Gaps vs. Your Goals

### Goal 1: "Each finished tournament lives forever"

**Current reality**: It lives until someone deletes it or Firebase has a problem. There is no immutability, no write protection on archived data, no separate durable storage.

**Gaps**:
- Archived tournaments can still be modified (name, portalId edits exist in the UI)
- Archived tournaments can be deleted with one click
- No concept of "finalized" state that prevents mutation
- Data lives in a single Firebase RTDB instance (europe-west1) with no cross-region replication you control

### Goal 2: "Have some backup separately"

**Current reality**: Zero backup infrastructure in the application. The only backup is whatever Firebase provides at the infrastructure level (automatic daily backups on Blaze plan, 30-day retention).

**Gaps**:
- No application-level export (JSON, CSV, PDF)
- No scheduled backup job (Cloud Function, cron)
- No secondary storage (Cloud Storage bucket, separate DB)
- No point-in-time restore capability from the app
- The `dump_*.json` file in the repo is a one-time manual export, not a system

### Goal 3: "See all finished tournaments as super user"

**Current reality**: The `/archived` view shows only YOUR archived tournaments (tournaments in your `userTournamentMap` with `status: 'archived'`). There is no cross-user visibility.

**Gaps**:
- `SUPER_ADMIN_EMAIL` exists but is only used for auto-adding as collaborator on QR code creation
- No admin panel that aggregates all users' archived tournaments
- No Firebase security rule that grants a super admin read access to all `{uid}/tournaments/` paths
- No concept of a global tournament registry

### Goal 4: "Checkbox to show/hide other tournaments (localStorage)"

**Current reality**: The archive view shows a flat list of all your archived tournaments. No filtering, no grouping by ownership, no show/hide toggle.

**Gaps**:
- No distinction between "my tournaments" vs "tournaments I was added to as collaborator"
- No localStorage-driven visibility filter
- No UI toggle component for this

---

## Resilience Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Durability | 3/10 | Single DB, no app-level backup, hard deletes |
| Availability | 7/10 | Firebase RTDB has good uptime SLA |
| Integrity | 4/10 | No checksums, no schema validation, archived data is mutable |
| Access Control | 6/10 | Per-user isolation works, but no super-admin cross-user access |
| Recoverability | 2/10 | No restore UI, no documented procedure, depends on Firebase infra backups |
| Scalability | 5/10 | All archives under one user node; no pagination in UI |

**Overall resilience: 4.5/10** — functional for a small-scale app but not designed for "lives forever" guarantees.

---

## Solution: Tournament Archive DB

### Design Goals

1. **Backups** — every archived tournament gets a JSON backup file, independent of Firebase
2. **Super admin list** — you see ALL archived tournaments (all users) with name, date, discipline in a fast-loading list
3. **Deletion control** — you can delete any non-portal tournament; owners can delete only their own non-portal tournaments; portal-imported tournaments are permanent
4. **Stats-ready** — the archive is a growing dataset you can query for statistics, trends, historical data

### What Happens When a Tournament Is Archived

```
User clicks "Archive" on a finished tournament
        │
        ▼
┌─────────────────────────────────────────────┐
│ Step 1: Write archive index entry            │
│                                              │
│  Write to `archive/{tid}`:                   │
│  {                                           │
│    name, date, system, teamsCount,           │
│    ownerUid, ownerEmail, portalId,           │
│    archivedAt, tournamentIsFinished          │
│  }                                           │
│  (~200 bytes — list rendering only)          │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ Step 2: Save JSON backup to Cloud Storage    │
│                                              │
│  Cloud Function triggers on index write:     │
│  - Reads full tournament from                │
│    `{ownerUid}/tournaments/{tid}`            │
│  - Saves complete .json file to bucket:      │
│    backups/{ownerUid}/{tid}.json             │
│  - File is immutable (bucket versioning ON)  │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ Step 3: Update status in user map            │
│                                              │
│  - userTournamentMap status → 'archived'     │
│  - Propagate to collaborators                │
│  - Remove from active list in UI             │
└─────────────────────────────────────────────┘
```

### Where Data Lives

| What | Where | Purpose |
|------|-------|---------|
| Full tournament data | `{uid}/tournaments/{tid}` (existing, unchanged) | Source of truth for viewing a tournament |
| Archive index | `archive/{tid}` (new, ~200 bytes each) | Fast list for super admin — name, date, system, teams count |
| JSON backup | Cloud Storage `backups/{ownerUid}/{tid}.json` | Disaster recovery — lives forever, independent of RTDB |

**No data duplication in Firebase.** The index holds only what you need to render the list. When you click a tournament, it fetches full data from the existing path. The JSON backup is a safety copy outside of Firebase entirely.

### Archive Index Schema

```
archive/
  {tournamentId}/
    name: "Кубок Кошового 2026"
    nameLower: "кубок кошового 2026"    ← lowercase for search
    date: "2026-06-15"                  ← tournament date (primary sort key)
    system: "swiss"                     ← discipline/format
    teamsCount: 60
    roundsPlayed: 5
    ownerUid: "abc123"
    ownerEmail: "user@example.com"
    portalId: "12345" | null            ← determines delete-ability
    archivedAt: "2026-08-06T14:30:00Z"
    tournamentIsFinished: true
    backupExists: true                  ← set by Cloud Function after backup success
```

**Size at 300 tournaments**: ~60KB total.

### Loading Strategy: Load-All + Client-Side Virtual Scroll

Firebase RTDB has no native full-text search or compound queries. For 300-1000 tournaments at ~200 bytes each (60-200KB), the pragmatic approach:

**Load the entire `archive/` index once on page open** → filter/sort/paginate in memory → render with virtual scroll (only DOM nodes for visible items).

Why this beats server-side pagination:
- Firebase RTDB pagination (`orderByChild` + `limitToFirst` + `startAfter`) only supports ONE sort field — you can't combine date sorting with name search
- 200KB is smaller than a single image — loads in <100ms on any connection
- Client-side filtering gives instant results as you type (no round-trips)
- Virtual scroll keeps DOM light regardless of list size (renders ~20 items, not 300)

```
┌─────────────────────────────────────────────────────────────┐
│ Archive View                                                 │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search by name...        ] [System ▾] [Date range ▾]   │
├─────────────────────────────────────────────────────────────┤
│ Кубок Кошового 2026        │ swiss  │ 60 teams │ 2026-06-15│
│ Відкритий Чемпіонат Києва  │ groups │ 24 teams │ 2026-05-20│
│ Кубок Весни                │ swiss  │ 32 teams │ 2026-04-10│
│ ...                                                          │
│          (virtual scroll — renders only visible rows)        │
│                                                              │
│                     ← scrolls smoothly →                     │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

```js
// On mount — one read, cached in store
const archiveIndex = await archiveService.getAll() // reads archive/

// Client-side filtering (reactive, instant)
const filtered = computed(() => {
  let list = Object.values(archiveIndex)

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => t.nameLower.includes(q) || t.date.includes(q))
  }
  if (systemFilter.value) {
    list = list.filter(t => t.system === systemFilter.value)
  }

  return list.sort((a, b) => b.date.localeCompare(a.date)) // newest first
})

// Virtual scroll — only render visible items
// Use vue-virtual-scroller or manual IntersectionObserver
```

**When to reconsider this approach**: if you ever hit 5000+ tournaments (~1MB index), switch to loading in chunks via `orderByChild('date').limitToLast(50).endBefore(cursor)`. But that's years away at 300 and growing.

### Search Capabilities

| Search type | How it works | Field used |
|-------------|-------------|------------|
| By name | `nameLower.includes(query)` — substring match, instant | `nameLower` |
| By date | `date.includes(query)` or date range picker | `date` |
| By discipline | Dropdown filter (swiss/groups/poules/supermele/tir) | `system` |
| By owner | Dropdown or type-ahead (super admin only) | `ownerEmail` |

All client-side — no Firebase queries needed after initial load.

**Stats-ready**: this index already gives you aggregates without loading full tournaments:
- Tournaments per month/year
- Most common formats (swiss vs groups vs poules)
- Average team count
- Growth over time

For deeper stats (player performance, head-to-head, score distributions), you load specific tournaments on demand from the existing path.

### JSON Backup File Format

```json
{
  "meta": {
    "tournamentId": "1781690385708",
    "archivedAt": "2026-08-06T14:30:00Z",
    "ownerUid": "abc123",
    "ownerEmail": "nemo15.alex@gmail.com",
    "portalId": "12345",
    "appVersion": "2.4.1"
  },
  "tournament": {
    "name": "Кубок Кошового 2026",
    "teams": [...],
    "games": [[...], [...], ...],
    "preferences": {...},
    "playOff": {...},
    "cadrage": {...},
    ...entire tournament state
  }
}
```

Stored at: `gs://petanque-draw-backups/backups/{ownerUid}/{tid}.json`

Bucket settings:
- Object Versioning: ON
- Retention: 365 days minimum (cannot be deleted before that)
- Lifecycle: move to Coldline after 90 days (cost saving for old backups)

### Deletion Rules

| Who | Tournament has portalId? | Can delete? |
|-----|--------------------------|-------------|
| Super admin | No | **Yes** |
| Super admin | Yes | **No** — permanent |
| Owner | No | **Yes** |
| Owner | Yes | **No** — permanent |
| Anyone else | — | **No** — can only hide from their own view |

When deleted:
- `archive/{tid}` index entry is removed
- `{ownerUid}/tournaments/{tid}` data is removed
- JSON backup in Cloud Storage is **NOT deleted** — it stays forever as a historical record

### Firebase Security Rules

```json
{
  "archive": {
    ".read": "auth.token.email === 'nemo15.alex@gmail.com'",
    "$tid": {
      ".write": "!data.exists() || (auth.token.email === 'nemo15.alex@gmail.com' && !data.child('portalId').exists()) || (auth.uid === data.child('ownerUid').val() && !data.child('portalId').exists())"
    }
  }
}
```

- **Read**: super admin reads all; regular users read via their own `userTournamentMap` (existing flow)
- **Write**: write-once for creation; deletion only by super admin or owner, and only when no portalId

### Super Admin Archive UI

The `/archived` view gets enhanced:

**For super admin (you)**:
- On mount: loads entire `archive/` index (~60KB for 300 tournaments) — cached in Pinia store
- Search bar: instant client-side filtering by name or date as you type
- Filters: dropdown for system (swiss/groups/poules/etc), date range picker
- Virtual scroll: renders only ~20 visible rows, smooth scroll through 300+ items
- Click any tournament → lazy-loads full data from `{ownerUid}/tournaments/{tid}`
- Delete button visible on non-portal tournaments
- Checkbox (localStorage): "Show other users' tournaments" — default ON for you

**For regular users** (unchanged):
- See only their own archived tournaments via `userTournamentMap`
- Same search/filter UI, just scoped to their own data
- Cannot delete portal-imported tournaments
- Can delete their own non-portal tournaments

### localStorage Toggle

- Key: `petanqueDrawArchiveShowAll`
- Super admin only — checkbox in archive header
- Default: `true` for super admin (you want to see everything)
- Default: hidden/irrelevant for regular users (they only see their own anyway)

---

## Implementation Plan

| # | Task | What | Effort |
|---|------|------|--------|
| 1 | Archive index service | Write index entry to `archive/{tid}` on archive action | Low |
| 2 | Deletion policy | Enforce portalId + role checks in UI and Firebase rules | Low |
| 3 | Super admin list UI | Enhanced `/archived` with full index, sorting, filtering | Medium |
| 4 | JSON backup Cloud Function | Auto-save `.json` to Cloud Storage on archive | Medium |
| 5 | localStorage toggle | Show/hide all users' tournaments checkbox | Low |
| 6 | Legacy migration | One-time script to create index entries for already-archived tournaments | Low |

### Dependencies

- Tasks 1-3, 5-6: no infrastructure changes needed (Firebase RTDB only)
- Task 4: requires Firebase Blaze plan + Cloud Functions + Cloud Storage bucket

**Recommended order**: 1 → 2 → 3 → 5 → 6 → 4

Start with the index + deletion policy + UI (pure frontend + RTDB rules, no billing changes). Add Cloud Function backup last — it's the safety net, not the core experience.

---

## Decisions Made

1. **No full data duplication** — archive index is metadata only (~200 bytes per tournament), full data stays at existing path
2. **Super admin** — hardcoded `nemo15.alex@gmail.com`
3. **Deletion policy** — portal-imported = permanent; non-portal = deletable by super admin or owner
4. **JSON backup** — Cloud Storage file saved automatically on archive, never deleted even when tournament is deleted from RTDB
5. **Stats goal** — archive index fields chosen to enable basic aggregation; deeper stats load full tournament on demand

## Decisions Needed

1. **Archive trigger** — automatic on `tournamentIsFinished: true`? Or manual only (current)?
2. **Legacy migration** — run once to backfill index entries for existing archived tournaments?
3. **Super admin default view** — show all by default, or require toggle? (recommended: all by default for you)
