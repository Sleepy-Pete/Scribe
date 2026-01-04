# OpenRouter Setup Guide

## Quick Start (5 minutes)

### Option A: Automated Setup (Recommended)

Run the interactive setup script:

```bash
./scripts/setup-openrouter.sh
```

This will guide you through:
1. Getting your API key
2. Choosing a model
3. Testing the connection
4. Running your first export

### Option B: Manual Setup

#### Step 1: Get Your OpenRouter API Key

1. Visit https://openrouter.ai/keys
2. Sign up or log in (supports Google, GitHub, email)
3. Click "Create Key"
4. Copy your API key (starts with `sk-or-v1-...`)

#### Step 2: Configure Scribe

Run this command to configure OpenRouter:

```bash
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "google/gemini-flash-1.5-8b",
    "api_key": "YOUR_API_KEY_HERE",
    "enabled": true
  }'
```

**Replace `YOUR_API_KEY_HERE` with your actual API key!**

#### Step 3: Test the Connection

```bash
curl -X POST http://127.0.0.1:3737/api/ai/test
```

You should see a successful response with a test summary.

#### Step 4: Export with AI Summary

```bash
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-03"}'
```

Check your Obsidian vault at `~/Petros/Scribe Tracker/` for the export!

---

## Recommended Models

### Budget-Friendly (Recommended)
- **`google/gemini-flash-1.5-8b`** - ~$0.001/day for typical use
  - Fast, cheap, great for summaries
  - Input: $0.0375/M tokens, Output: $0.15/M tokens

### Better Quality
- **`google/gemini-2.0-flash-exp:free`** - FREE (rate limited)
  - Latest Gemini model, experimental
  
- **`anthropic/claude-3.5-haiku`** - ~$0.01/day
  - Better reasoning, more nuanced summaries
  - Input: $1.00/M tokens, Output: $5.00/M tokens

### Premium
- **`anthropic/claude-3.7-sonnet`** - ~$0.05/day
  - Best quality, most insightful
  - Input: $3.00/M tokens, Output: $15.00/M tokens

---

## Cost Estimates

Based on 100 exports/month with ~2000 tokens each:

| Model | Monthly Cost | Quality |
|-------|--------------|---------|
| Gemini Flash 8B | $0.02-0.10 | Good |
| Claude 3.5 Haiku | $0.50-1.00 | Better |
| Claude 3.7 Sonnet | $3.00-5.00 | Best |

---

## Switching Models

To change models anytime:

```bash
curl -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-haiku"
  }'
```

---

## View Current Settings

```bash
curl http://127.0.0.1:3737/api/ai/settings
```

---

## Troubleshooting

### "AI API key not configured"
- Make sure you included the `api_key` field in the configuration
- Verify the key starts with `sk-or-v1-`

### "Model not found"
- Check the model name at https://openrouter.ai/models
- Model names are case-sensitive and include the provider prefix

### "Insufficient credits"
- Add credits at https://openrouter.ai/settings/credits
- Minimum: $5 (lasts months with Gemini Flash)

---

## Privacy & Security

- Your API key is stored locally in `~/.scribe-tracker/activity.db`
- Only summary context is sent to OpenRouter (no raw window titles if privacy mode is on)
- OpenRouter doesn't train on your data by default
- You can disable data retention per request (see Advanced section)

---

## Advanced: Disable Data Retention

To prevent OpenRouter from storing your requests:

Edit `apps/api/src/ai-summary.ts` and add to the API call:

```typescript
const response = await client.chat.completions.create({
  model,
  messages: [...],
  headers: {
    'HTTP-Referer': 'https://scribe-tracker.local',
    'X-Title': 'Scribe Tracker',
    'OpenRouter-No-Store': 'true'  // Add this line
  }
});
```

---

## Next Steps

1. ✅ Get API key from OpenRouter
2. ✅ Configure Scribe with the command above
3. ✅ Test the connection
4. ✅ Run your first export
5. 🎉 Enjoy AI-powered daily summaries!

**Estimated setup time: 5 minutes**
**Estimated monthly cost: $0.02-0.10 (with Gemini Flash)**

