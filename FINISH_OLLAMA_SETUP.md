# Complete Ollama Setup - Quick Guide

## Current Status

✅ AI summary code fully implemented
✅ API running with AI enabled
⏳ Ollama installing via brew (running in background)

## Steps to Complete

### 1. Wait for Brew Install to Finish

The command `brew install ollama` is currently running in Terminal ID 2.
This may take 10-30 minutes on macOS 13 due to building dependencies.

**Check if it's done:**
```bash
which ollama
# Should output: /usr/local/bin/ollama or /opt/homebrew/bin/ollama
```

### 2. Start Ollama Service

Once installed, start the Ollama server:

```bash
ollama serve
```

**Keep this terminal open!** Ollama needs to run in the background.

### 3. Pull a Model (New Terminal)

In a **new terminal**, pull a model:

```bash
# Recommended: Fast, good quality, ~2GB
ollama pull llama3.2

# Alternative options:
# ollama pull qwen2.5      # Faster, smaller
# ollama pull mistral      # Larger, better quality
```

This will download ~2GB. Wait for it to complete.

### 4. Test AI Connection

```bash
curl -X POST http://127.0.0.1:3737/api/ai/test
```

**Expected output:**
```json
{
  "success": true,
  "summary": "This is a test connection summary..."
}
```

### 5. Export with AI Summary

```bash
# Export today
curl -X POST http://127.0.0.1:3737/api/obsidian/export

# Or specific date
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-03"}'
```

### 6. Check the Export

```bash
# View today's export
cat ~/Petros/Scribe\ Tracker/$(date +%Y%m%d)\ -\ Export.md | head -20
```

**You should see:**
```markdown
# Saturday, January 3, 2026

## 🤖 AI Summary

[AI-generated summary here]

---

## Activity Summary (Tracked Data)
...
```

## Troubleshooting

### Ollama Install Fails

If brew install fails or takes too long, download directly:

```bash
# Cancel brew install
Ctrl+C

# Download and install manually
curl -fsSL https://ollama.com/install.sh | sh
```

### Ollama Not Responding

```bash
# Check if Ollama is running
ps aux | grep ollama

# If not running, start it
ollama serve
```

### Model Not Found

```bash
# List installed models
ollama list

# Pull the model
ollama pull llama3.2
```

### AI Summary Not Appearing

```bash
# 1. Check AI is enabled
curl http://127.0.0.1:3737/api/ai/settings

# 2. Enable if needed
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# 3. Test connection
curl -X POST http://127.0.0.1:3737/api/ai/test

# 4. Check Ollama is running
curl http://localhost:11434/api/tags
```

## Quick Test Script

Run this after Ollama is set up:

```bash
./test-ai-summary.sh
```

## Alternative: Use OpenRouter Instead

If Ollama install is problematic, switch to OpenRouter:

```bash
# Get API key from https://openrouter.ai/keys

# Configure
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "google/gemini-flash-1.5-8b",
    "api_key": "sk-or-v1-YOUR_KEY_HERE",
    "enabled": true
  }'

# Test
curl -X POST http://127.0.0.1:3737/api/ai/test

# Export
curl -X POST http://127.0.0.1:3737/api/obsidian/export
```

Cost: ~$0.001 per summary (essentially free for daily use)

## Summary

**What's working now:**
- ✅ API with AI endpoints
- ✅ Export integration
- ✅ Settings configured

**What you need to do:**
1. Wait for `brew install ollama` to finish
2. Run `ollama serve`
3. Run `ollama pull llama3.2`
4. Test with `curl -X POST http://127.0.0.1:3737/api/ai/test`
5. Export with AI summary!

See `AI_SUMMARY.md` for full documentation.

