# AI Summary Feature

## Overview

AI-powered summaries are now integrated into Obsidian exports. The system combines your personal notes with tracked activity data to generate concise, actionable insights.

## Features

- **Multiple AI Providers**: OpenRouter (recommended), Ollama (local/free), or OpenAI
- **Smart Context**: Combines tracker stats + personal notes
- **Auto-Generated**: Runs during daily export
- **Cost-Effective**: ~$0.02-0.10/month with OpenRouter's Gemini Flash
- **Privacy-First**: Ollama runs locally, no data sent externally

## Quick Start (Recommended: OpenRouter)

**See [OPENROUTER_SETUP.md](./OPENROUTER_SETUP.md) for detailed setup instructions.**

1. Get API key: https://openrouter.ai/keys
2. Configure Scribe (replace `YOUR_KEY`):
   ```bash
   curl -X PUT http://127.0.0.1:3737/api/ai/settings \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "openrouter",
       "model": "google/gemini-flash-1.5-8b",
       "api_key": "YOUR_KEY",
       "enabled": true
     }'
   ```
3. Test: `curl -X POST http://127.0.0.1:3737/api/ai/test`
4. Export: `curl -X POST http://127.0.0.1:3737/api/obsidian/export -H "Content-Type: application/json" -d '{"date":"2026-01-03"}'`

## Configuration

### Settings

Configure via API:

```bash
# View current AI settings
curl http://127.0.0.1:3737/api/ai/settings

# Update AI provider (ollama, openrouter, or openai)
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ollama",
    "model": "llama3.2",
    "enabled": true
  }'

# For OpenRouter/OpenAI, add API key
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-haiku",
    "api_key": "sk-or-v1-...",
    "enabled": true
  }'
```

### Available Settings

- `ai_provider`: `ollama` (default), `openrouter`, or `openai`
- `ai_model`: Model name (e.g., `llama3.2`, `gpt-4o-mini`, `anthropic/claude-3.5-haiku`)
- `ai_summary_enabled`: `true` or `false`
- `ai_api_key`: API key for OpenRouter/OpenAI (not needed for Ollama)

## Setup Instructions

### Option 1: OpenRouter (Recommended - Cloud, Pay-as-you-go)

**See [OPENROUTER_SETUP.md](./OPENROUTER_SETUP.md) for complete guide.**

1. **Get API key**: https://openrouter.ai/keys

2. **Configure**:
   ```bash
   curl -X PUT http://127.0.0.1:3737/api/ai/settings \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "openrouter",
       "model": "google/gemini-flash-1.5-8b",
       "api_key": "sk-or-v1-YOUR_KEY_HERE",
       "enabled": true
     }'
   ```

3. **Test**:
   ```bash
   curl -X POST http://127.0.0.1:3737/api/ai/test
   ```

**Recommended models:**
- `google/gemini-flash-1.5-8b` - Cheapest (~$0.001/day)
- `google/gemini-2.0-flash-exp:free` - FREE (rate limited)
- `anthropic/claude-3.5-haiku` - Better quality (~$0.01/day)

### Option 2: Ollama (Free & Local)

1. **Install Ollama**:
   ```bash
   brew install ollama
   ```

2. **Start Ollama**:
   ```bash
   ollama serve
   ```

3. **Pull a model**:
   ```bash
   ollama pull llama3.2
   # or
   ollama pull qwen2.5
   # or
   ollama pull mistral
   ```

4. **Test connection**:
   ```bash
   curl -X POST http://127.0.0.1:3737/api/ai/test
   ```



### Option 2: OpenAI Direct

1. **Get API key**: https://platform.openai.com/api-keys

2. **Configure**:
   ```bash
   curl -X PUT http://127.0.0.1:3737/api/ai/settings \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "openai",
       "model": "gpt-4o-mini",
       "api_key": "sk-YOUR_KEY_HERE",
       "enabled": true
     }'
   ```

## Export Format

When AI summary is enabled, exports include a new section at the top:

```markdown
# Friday, January 3, 2026

## 🤖 AI Summary

You spent 3 hours actively working, with most time in Chrome and VS Code. 
Your notes indicate focus on the Scribe tracker project, specifically adding 
AI summary features. Strong coding session with minimal distractions.

---

## Personal Notes

[Your personal notes here]

---

## Activity Summary (Tracked Data)

### Stats
...
```

## Testing

```bash
# Test AI connection
curl -X POST http://127.0.0.1:3737/api/ai/test

# Export today with AI summary
curl -X POST http://127.0.0.1:3737/api/obsidian/export

# Export specific date
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-03"}'
```

## Troubleshooting

### Ollama not responding
- Make sure Ollama is running: `ollama serve`
- Check if model is installed: `ollama list`
- Pull model if needed: `ollama pull llama3.2`

### OpenRouter/OpenAI errors
- Verify API key is correct
- Check you have credits/billing enabled
- Test with smaller model first

### Summary not appearing
- Check `ai_summary_enabled` is `true`
- View API logs for errors
- Test connection: `curl -X POST http://127.0.0.1:3737/api/ai/test`

## Cost Comparison

| Provider | Model | Cost per 1M tokens | Notes |
|----------|-------|-------------------|-------|
| Ollama | llama3.2 | **FREE** | Runs locally, requires ~4GB RAM |
| OpenRouter | gemini-flash-1.5 | ~$0.10 | Fastest, cheapest cloud option |
| OpenRouter | claude-3.5-haiku | ~$0.25 | Best quality for price |
| OpenAI | gpt-4o-mini | ~$0.15 | Good balance |

**Estimated daily cost**: ~$0.001-0.01 per day with cloud providers (assuming 1-2 summaries/day)

