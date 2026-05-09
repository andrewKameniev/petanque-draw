# Tournament Logo Upload & Public View Redesign

## Analysis

### Current State
- **Public view** (`src/views/Public.vue`) shows a tournament info card with:
  - Status badge (absolute positioned, top-right corner)
  - "Show Bracket" button (absolute positioned, bottom-right corner)
  - Organizer message (can be multi-line, unlimited length)
  - Tournament metadata rows (system, teams count, cadrage, playoff)
- **No image upload** exists anywhere in the project
- **Firebase Storage** is configured in the project (`storageBucket: "petanque-draw.appspot.com"`) but not initialized in code — only Auth + Realtime Database are used
- **Data flow**: Tournament organizer edits in `Tournament.vue`, data syncs to Firebase RTDB via `syncToFirebase()`, public view reads it via `tournamentService.subscribe()`

### Architecture Decisions

#### Image Upload Library: `vue-cropperjs` (wrapper for Cropper.js)
**Why this over alternatives:**
| Library | Size | Cropper | Vue 3 | Maintained |
|---------|------|---------|--------|------------|
| `vue-cropperjs` | ~40KB | Yes (Cropper.js) | Yes | Active |
| `vue-advanced-cropper` | ~60KB | Yes (custom) | Yes | Active |
| `cropperjs` (raw) | ~35KB | Yes | Manual | Active |

**Recommendation: `vue-advanced-cropper`**
- Purpose-built for Vue 3 with composition API support
- Built-in mobile touch support (pinch zoom, drag)
- Circular/rectangular crop areas
- No jQuery dependency
- Better DX: single component `<Cropper>` with props for aspect ratio, boundaries
- Lighter than vue-cropperjs in practice (tree-shakeable)
- Active maintenance, TypeScript support

#### Storage: Firebase Storage
- Already configured in `firebaseConfig` (storageBucket exists)
- Just needs `getStorage()` initialization
- Path structure: `logos/{userId}/{tournamentId}.jpg`
- Store download URL in tournament RTDB data as `logoUrl` field

#### Image constraints
- Max upload size: 2MB
- Output: JPEG, quality 0.8, max 400x400px
- Aspect ratio: free (logo can be square, horizontal, or circular)
- Displayed size: ~80px height in public view widget

---

## Task List

### Phase 1: Firebase Storage Setup
- [ ] 1.1 Initialize Firebase Storage in `src/firebase.js` (add `getStorage`)
- [ ] 1.2 Create `src/services/storage.js` with upload/delete functions
- [ ] 1.3 Add Firebase Storage security rules note (organizer can write to own path)

### Phase 2: Image Upload Component (Organizer Side)
- [ ] 2.1 Install `vue-advanced-cropper` package
- [ ] 2.2 Create `src/components/partials/LogoUpload.vue` component:
  - File input (accept image/*)
  - Crop modal with `vue-advanced-cropper`
  - Preview of current logo
  - Upload button + loading state
  - Delete/remove logo button
- [ ] 2.3 Integrate `LogoUpload` into `Tournament.vue` toolbar (near message button)
- [ ] 2.4 Save `logoUrl` to tournament data in RTDB after upload
- [ ] 2.5 Handle logo deletion (remove from Storage + clear `logoUrl` in RTDB)

### Phase 3: Public View Widget Redesign
- [ ] 3.1 Redesign `.tournament-info-card` layout to accommodate logo:
  - **Desktop**: Logo on the left, info content in the middle, badge top-right
  - **Mobile**: Logo centered above info, badge below logo or inline
  - No absolute positioning for badge/bracket button (use flexbox flow)
- [ ] 3.2 New layout structure:
  ```
  ┌─────────────────────────────────────────────────┐
  │ [Logo]  Tournament Info          [Status Badge] │
  │         System: Swiss                           │
  │         Teams: 16                               │
  │         Playoff: 8 teams                        │
  │                                                 │
  │  Organizer message (full width, below info)     │
  │  can be multiple lines...                       │
  │                                    [Bracket ▸]  │
  └─────────────────────────────────────────────────┘
  ```
  Mobile:
  ```
  ┌─────────────────────────────┐
  │      [Logo]                 │
  │   [Status Badge]            │
  │                             │
  │ System: Swiss               │
  │ Teams: 16                   │
  │ Playoff: 8 teams            │
  │                             │
  │ Organizer message...        │
  │ (scrollable/expandable)     │
  │                             │
  │       [Bracket ▸]           │
  └─────────────────────────────┘
  ```
- [ ] 3.3 Remove all absolute positioning from badge and bracket button
- [ ] 3.4 Add logo display with fallback (no logo = no space taken)
- [ ] 3.5 Handle long organizer messages:
  - Show full message (no truncation) but move it to its own section below metadata
  - On mobile: max-height with "show more" expand if > 4 lines
- [ ] 3.6 Ensure proper spacing/gap between all elements, no overlaps
- [ ] 3.7 Dark theme support for new layout

### Phase 4: Styling & Polish
- [ ] 4.1 Logo display: rounded corners, subtle border, object-fit: cover
- [ ] 4.2 Responsive breakpoints: test 320px, 375px, 768px, 1024px
- [ ] 4.3 Loading skeleton for logo image
- [ ] 4.4 Smooth transitions when logo loads

### Phase 5: i18n
- [ ] 5.1 Add translation keys for upload UI (upload logo, remove logo, crop, etc.)

---

## Key Principles
- **No overlap**: Replace absolute positioning with flexbox layout
- **Mobile-first**: Design for 320px+ then enhance for desktop
- **Graceful degradation**: Widget looks good with or without logo
- **Performance**: Compress image before upload, lazy-load in public view
