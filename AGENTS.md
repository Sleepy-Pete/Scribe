# Scribe + Augment AI Context

## 1. Scribe Overview & This File's Role

**Scribe** is a local-first activity tracker that records app usage, browser activity, and calls into a SQLite database. It provides:
- Background tracker service (polls active windows)
- Local REST API server (port 3737)
- Terminal User Interface (TUI)
- Obsidian export with optional AI-powered summaries

**This file is the canonical instruction set for AI assistants working on this repo.**  
If any other markdown (old context notes, investigations, session docs) conflicts with this file, **this file wins**.

---

## 2. AI Working Agreement (How to Operate on This Repo)

### Core Principles
- **Follow existing patterns first.** Smallest diff that works.
- **No new deps, no refactors unless asked.**
- **Update/add tests for behavior changes.**
- **No secrets, no PII logs.**

### Output Format
When making changes, provide:
- **Plan** (3 bullets max)
- **Patch/diff** (actual code changes)
- **Commands** (to build, test, verify)
- **Risks** (what could break)

### When Uncertain
- Ask **one concise clarifying question**, OR
- Make **one clearly labeled assumption** and proceed

### Safety & Privacy
- Never log API keys, tokens, or personal data (window titles/URLs) in plaintext outside existing logging conventions
- Be careful with anything touching `~/.scribe-tracker/activity.db` and user vault paths (`~/Petros/...`)
- Respect privacy mode settings when handling window titles and URLs

### Tests & Verification
- For any behavior change, **update or add tests** in the relevant package
- Prefer running the **smallest relevant test scope** (single file/package over whole monorepo)
- Always verify changes work before marking complete

---

## 3. Repository Map & Conventions

### Apps
- **`apps/api`** – Local REST API server (port 3737)
  - Obsidian export + AI summary endpoints
  - Stats, timeline, settings endpoints
  - Source: TypeScript, runs with ts-node or compiled

- **`apps/tracker`** – Background tracker service
  - Polls active windows every 1s (configurable)
  - Writes events to SQLite
  - Session consolidation logic (browsers by domain, communication apps by app)

- **`apps/tui`** – Blessed-based Terminal User Interface
  - Consumes API data
  - Views: Timeline, Statistics, Settings, Export
  - Keyboard-driven navigation

### Shared Modules
- **`shared/types`** – Shared TypeScript types
  - Must be built before using: `cd shared/types && npm run build`
  - Defines ActivityEvent, Settings, DateSummary, etc.

- **`shared/database`** – DB access layer for `activity.db`
  - Source of truth for all queries
  - Must be built before using: `cd shared/database && npm run build`
  - Location: `~/.scribe-tracker/activity.db`

### Key Conventions
- **TypeScript throughout** apps and shared modules
- **Duration calculations**: Always compute from `start_ts`/`end_ts`, NOT from cached `active_seconds` field (see BUGFIX_DURATION_CALCULATION.md)
- **Session consolidation**:
  - Browsers: consolidated by domain (same domain = one session)
  - Communication apps (Discord, Slack): consolidated by app (ignore window title changes)
  - Other apps: new session on window title change
- **New features should be wired**: DB (`shared/database`) → Types (`shared/types`) → API (`apps/api`) → UI (`apps/tui`)

---

## 4. Tests & Verification

### Build Shared Modules (Required Before Testing)
```bash
cd shared/types && npm run build && cd ../..
cd shared/database && npm run build && cd ../..
```

### Run Dev Services
```bash
# All services at once
./start-tui.sh

# Or individually:
npm run dev:api      # API server
npm run dev:tracker  # Tracker service
cd apps/tui && npm run dev  # TUI
```

### Verification Commands
```bash
# Health check
curl http://127.0.0.1:3737/health

# Test AI summary
./test-ai-summary.sh

# Test Obsidian export
node test-obsidian-export.js

# Check database
sqlite3 ~/.scribe-tracker/activity.db "SELECT COUNT(*) FROM events;"
```

### Guideline
- Prefer **targeted checks** over "run everything"
- If a change affects only API, don't run TUI tests unless necessary
- Always rebuild shared modules if you change types or database code

---

## 5. Current Priorities & Non-Goals

### Current Priorities
- [ ] Improve reliability of Chrome/web tracking and context display in TUI
- [ ] Polish AI summary quality for Obsidian exports (window titles, activity patterns)
- [ ] Keep Obsidian export and auto-export robust (no duplicate or missing days)
- [ ] Maintain session consolidation logic (browsers by domain, communication apps by app)

### Non-Goals (Do Not Change Without Explicit Request)
- [ ] Core DB schema (`events`, `settings` tables) beyond incremental, well-justified additions
- [ ] Major TUI redesign or visual overhaul
- [ ] Switching DB library away from `better-sqlite3`
- [ ] Adding browser extensions (future feature, not current priority)
- [ ] Windows/Linux support (macOS only for now)

---

## 6. Other Docs to Consult

### Primary Documentation
- **`README.md`** – Project overview, architecture, installation, usage
- **`CHANGELOG.md`** – Recent changes; check here before re-solving solved problems
- **`TROUBLESHOOTING.md`** – Standard operating procedures when things don't start

### AI & Export Related
- **`AI_SUMMARY.md`** – AI summary behavior & configuration (Ollama, OpenRouter, OpenAI)
- **`OPENROUTER_SETUP.md`** – OpenRouter setup guide (recommended AI provider)
- **`AUTOMATED_OBSIDIAN_EXPORT.md`** – Auto-export system, smart merging with personal notes
- **`QUICK_START.md`** – 5-minute setup guide

### Historical Bug Fixes & Investigations (Descriptive, Not Rules)
- **`BUGFIX_DURATION_CALCULATION.md`** – Duration calculation bug (Dec 31, 2025)
- **`OBSIDIAN_DATE_BUG_FIX.md`** – Timezone handling bug (Dec 31, 2025)
- **`SESSION_TIMELINE_FIX.md`** – Session consolidation implementation (Dec 31, 2025)
- **`CHROME_CONTEXT_LOSS_INVESTIGATION.md`** – Chrome window title bug investigation (Jan 2-3, 2026)

**Note:** These docs are **descriptive/historical**, not rules. Use them to understand past decisions and behavior, but do not treat them as higher priority than this file.

---

## 7. When Rules Conflict

### Precedence Order
1. **This file (`AGENTS.md`)** – Canonical rules for how to operate
2. **`NEXT_SESSION_START_HERE.md`** – Current session plan / immediate next steps (if present)
3. **Other documentation** – Descriptive, historical, reference only

### Conflict Resolution
If this file conflicts with:
- Old context notes (`CONTEXT_NOTE_*.md`, `NEXT_SESSION_*.md`)
- Historical bug docs (`*_BUG_FIX.md`, `*_INVESTIGATION.md`)
- Comments in code
- Other markdown files

Then **`AGENTS.md` takes precedence** for how to proceed.

### Session Context
- For **current task roadmap / immediate next steps**, consult `NEXT_SESSION_START_HERE.md` (if present)
- Treat other dated notes as **archive** – useful for understanding history, but not current instructions

---

## 8. Quick Reference

### Most Common Commands
```bash
# Start everything
./start-tui.sh

# Rebuild shared modules
cd shared/types && npm run build && cd ../..
cd shared/database && npm run build && cd ../..

# Check API health
curl http://127.0.0.1:3737/health

# Export to Obsidian
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-04"}'

# View AI settings
curl http://127.0.0.1:3737/api/ai/settings

# Check database
sqlite3 ~/.scribe-tracker/activity.db
```

### Key Files to Know
- `apps/tracker/src/session-manager.ts` – Session consolidation logic
- `apps/api/src/obsidian.ts` – Obsidian export generation
- `apps/api/src/ai-summary.ts` – AI summary generation
- `shared/database/src/index.ts` – All database queries
- `shared/types/src/index.ts` – Type definitions

---

**Last Updated:** 2026-01-04  
**Maintained By:** Project owner (update this file as priorities shift)

