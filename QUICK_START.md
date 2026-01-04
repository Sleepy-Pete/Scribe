# Scribe Tracker - Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Start the Services

```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start TUI (optional)
npm run dev:tui
```

### 2. Configure OpenRouter AI (Recommended)

**Option A: Automated Setup (Easiest)**
```bash
npm run setup:openrouter
```

**Option B: Manual Setup**
```bash
# Get your API key from: https://openrouter.ai/keys
# Then run:
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "google/gemini-flash-1.5-8b",
    "api_key": "YOUR_API_KEY_HERE",
    "enabled": true
  }'
```

### 3. Test AI Connection

```bash
curl -X POST http://127.0.0.1:3737/api/ai/test
```

### 4. Export Today's Data

```bash
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-03"}'
```

Check your Obsidian vault at: `~/Petros/Scribe Tracker/`

---

## 📚 Documentation

- **[OPENROUTER_SETUP.md](./OPENROUTER_SETUP.md)** - Complete OpenRouter setup guide
- **[AI_SUMMARY.md](./AI_SUMMARY.md)** - AI summary feature documentation
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Full setup documentation

---

## 🔧 Common Commands

### View AI Settings
```bash
curl http://127.0.0.1:3737/api/ai/settings
```

### Change AI Model
```bash
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{"model": "anthropic/claude-3.5-haiku"}'
```

### View All Settings
```bash
curl http://127.0.0.1:3737/api/settings
```

### Export Specific Date
```bash
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-02"}'
```

---

## 💰 Cost Estimates (OpenRouter)

| Model | Monthly Cost* | Quality |
|-------|--------------|---------|
| `google/gemini-flash-1.5-8b` | $0.02-0.10 | Good |
| `google/gemini-2.0-flash-exp:free` | FREE | Good (rate limited) |
| `anthropic/claude-3.5-haiku` | $0.50-1.00 | Better |
| `anthropic/claude-3.7-sonnet` | $3.00-5.00 | Best |

*Based on 100 exports/month

---

## 🎯 Next Steps

1. ✅ Start the API server
2. ✅ Configure OpenRouter
3. ✅ Test AI connection
4. ✅ Run your first export
5. 🎉 Check your Obsidian vault!

**Need help?** See the full documentation in the files above.

