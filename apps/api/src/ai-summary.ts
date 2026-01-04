import { getSetting } from '@scribe/database';
import { ActivityEvent } from '@scribe/types';
import OpenAI from 'openai';

interface AISummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * Generate AI summary of daily activities and personal notes
 */
export async function generateAISummary(
  date: string,
  events: ActivityEvent[],
  personalNotes?: string
): Promise<AISummaryResult> {
  try {
    const enabled = getSetting('ai_summary_enabled') === 'true';
    if (!enabled) {
      return { success: false, error: 'AI summary is disabled' };
    }

    const provider = getSetting('ai_provider') || 'ollama';
    const model = getSetting('ai_model') || 'llama3.2';

    // Prepare context from tracker data
    const context = prepareContext(date, events, personalNotes);

    // Generate summary based on provider
    if (provider === 'ollama') {
      return await generateWithOllama(model, context);
    } else if (provider === 'openrouter' || provider === 'openai') {
      return await generateWithOpenAI(provider, model, context);
    } else {
      return { success: false, error: `Unknown AI provider: ${provider}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Prepare context for AI summary
 */
function prepareContext(date: string, events: ActivityEvent[], personalNotes?: string): string {
  const totalSeconds = events.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Group by app/domain
  const appTime: Record<string, number> = {};
  const domainTime: Record<string, number> = {};
  const windowTitleTime: Record<string, Record<string, number>> = {}; // app -> title -> seconds

  for (const event of events) {
    const key = event.kind === 'web' ? event.domain || 'Unknown' : event.app_name || 'Unknown';
    appTime[key] = (appTime[key] || 0) + Math.floor((event.end_ts - event.start_ts) / 1000);

    // Track domains separately for web activity
    if (event.kind === 'web' && event.domain) {
      domainTime[event.domain] = (domainTime[event.domain] || 0) + Math.floor((event.end_ts - event.start_ts) / 1000);
    }

    // Collect window titles with time spent
    if (event.window_title && event.window_title.trim()) {
      const title = event.window_title.trim();
      if (!windowTitleTime[key]) {
        windowTitleTime[key] = {};
      }
      const duration = Math.floor((event.end_ts - event.start_ts) / 1000);
      windowTitleTime[key][title] = (windowTitleTime[key][title] || 0) + duration;
    }
  }

  // Helper function to normalize titles for deduplication
  const normalizeTitle = (title: string): string => {
    return title.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/^(new tab|untitled|newtab)$/i, '[new-tab]');
  };

  // Helper function to consolidate similar titles
  const consolidateTitles = (titles: Record<string, number>): string[] => {
    const genericTitles = new Set(['[new-tab]']);
    const titleMap = new Map<string, { original: string; time: number }>();

    // Group by normalized title, keeping the one with most time
    for (const [title, time] of Object.entries(titles)) {
      const normalized = normalizeTitle(title);
      if (genericTitles.has(normalized)) continue; // Skip generic titles

      const existing = titleMap.get(normalized);
      if (!existing || time > existing.time) {
        titleMap.set(normalized, { original: title, time });
      } else {
        // Accumulate time for duplicates
        existing.time += time;
      }
    }

    // Sort by time and return top titles
    return Array.from(titleMap.values())
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)
      .map(item => item.original);
  };

  const topApps = Object.entries(appTime)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, seconds]) => `${name} (${Math.floor(seconds / 60)}m)`)
    .join(', ');

  const topDomains = Object.entries(domainTime)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, seconds]) => `${domain} (${Math.floor(seconds / 60)}m)`)
    .join(', ');

  // Detect activity patterns
  const codingApps = ['Code', 'Visual Studio Code', 'Terminal', 'iTerm'];
  const codingTime = Object.entries(appTime)
    .filter(([app]) => codingApps.some(ca => app.includes(ca)))
    .reduce((sum, [, seconds]) => sum + seconds, 0);

  const browserApps = ['Google Chrome', 'Safari', 'Firefox', 'Arc'];
  const browserTime = Object.entries(appTime)
    .filter(([app]) => browserApps.some(ba => app.includes(ba)))
    .reduce((sum, [, seconds]) => sum + seconds, 0);

  const commApps = ['Slack', 'Discord', 'Messages', 'Mail', 'Zoom', 'Meet'];
  const commTime = Object.entries(appTime)
    .filter(([app]) => commApps.some(ca => app.includes(ca)))
    .reduce((sum, [, seconds]) => sum + seconds, 0);

  // Build context - PRIORITIZE specific activities at the top
  let context = `Date: ${date}\n`;
  context += `Total active time: ${hours}h ${minutes}m\n\n`;

  // MOST IMPORTANT: Specific activities first (what Claude should focus on)
  context += `=== SPECIFIC ACTIVITIES (by time spent) ===\n`;
  const sortedApps = Object.entries(windowTitleTime)
    .sort((a, b) => {
      const aTotal = Object.values(a[1]).reduce((sum, t) => sum + t, 0);
      const bTotal = Object.values(b[1]).reduce((sum, t) => sum + t, 0);
      return bTotal - aTotal;
    })
    .slice(0, 8); // Top 8 apps by total window title time

  for (const [app, titles] of sortedApps) {
    const consolidated = consolidateTitles(titles);
    if (consolidated.length > 0) {
      // Show top 8 most significant activities for this app
      const topActivities = consolidated.slice(0, 8).join('; ');
      context += `${app}: ${topActivities}\n`;
    }
  }
  context += `\n`;

  if (personalNotes) {
    context += `=== PERSONAL NOTES ===\n${personalNotes}\n\n`;
  }

  // Summary stats (less important, at the bottom)
  context += `=== SUMMARY STATS ===\n`;
  context += `Activity breakdown:\n`;
  if (codingTime > 0) context += `- Coding/Development: ${Math.floor(codingTime / 60)}m\n`;
  if (browserTime > 0) context += `- Web browsing: ${Math.floor(browserTime / 60)}m\n`;
  if (commTime > 0) context += `- Communication: ${Math.floor(commTime / 60)}m\n`;
  context += `\n`;

  context += `Top apps/tools: ${topApps}\n`;
  if (topDomains) {
    context += `Top websites visited: ${topDomains}\n`;
  }
  context += `Number of events: ${events.length}\n`;

  return context;
}

/**
 * Generate summary using Ollama (local)
 */
async function generateWithOllama(model: string, context: string): Promise<AISummaryResult> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `You are a productivity assistant. Based on the following activity data and personal notes, generate a concise 2-3 sentence summary highlighting key insights, patterns, or accomplishments. Be specific and actionable.\n\n${context}\n\nSummary:`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return { success: true, summary: data.response.trim() };
  } catch (error: any) {
    return { success: false, error: `Ollama error: ${error.message}` };
  }
}

/**
 * Generate summary using OpenAI or OpenRouter
 */
async function generateWithOpenAI(provider: string, model: string, context: string): Promise<AISummaryResult> {
  try {
    const apiKey = getSetting('ai_api_key');
    if (!apiKey) {
      return { success: false, error: 'AI API key not configured' };
    }

    const baseURL = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';

    const client = new OpenAI({
      apiKey,
      baseURL,
      // OpenRouter-specific headers
      defaultHeaders: provider === 'openrouter' ? {
        'HTTP-Referer': 'https://github.com/yourusername/scribe',
        'X-Title': 'Scribe Tracker'
      } : {}
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You write a daily narrative summary that synthesizes activity tracking data with personal notes into one organized document.

Goal:
Create a well-structured day recap that combines what the tracker saw with what the user wrote, organizing everything into a coherent narrative.

Non-negotiable rules:
- Do not invent facts. Only use details present in the input.
- You MUST mention at least 5-8 specific websites, projects, or activities by name from the "SPECIFIC ACTIVITIES" section.
- Be concrete and detailed - use actual names like "Peter Ariet portfolio site" or "Tales from Soda Island" not generic terms like "portfolio work" or "projects".
- Interpretation is allowed, but must be framed as probabilistic (may, might, seems, suggests) unless explicitly stated in notes.
- Any emotional, motivational, or causal claim must be anchored to a specific note or a clear data signal, otherwise omit it.
- Do not diagnose, label medical conditions, or make strong claims about the user's mental state.
- Tone: warm, direct, not preachy.

Your Task:
Read the personal notes (if provided) and the tracker data. Then organize everything into a structured summary that:
- Preserves important details from both sources with SPECIFIC examples
- Groups related activities together (e.g., "researched Venezuela news on Reddit and flight trackers")
- Uses markdown headings/subheadings to create clear sections
- Connects tracker patterns to note content where relevant
- Maintains the user's voice and structure from their notes when present

Output format:
Create an organized markdown document with appropriate headings and structure. The structure should emerge naturally from the content - don't force a rigid template. Common patterns might include:
- Time/activity breakdowns (with specific project/site names)
- Emotional/mental state
- Work/projects (name them specifically)
- Goals or intentions
- Reflections or insights

Use 2-4 main sections (##) with subsections (###) as needed. Each section should integrate both tracker data and note content where relevant.

If personal notes are minimal or absent, focus on organizing the tracker data with light interpretation, but ALWAYS mention specific activities, websites, and projects by name.
If personal notes are rich and structured, honor that structure while weaving in tracker insights with specific details.`
        },
        {
          role: 'user',
          content: context
        }
      ],
      max_tokens: 1000,
      temperature: 0.25
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      return { success: false, error: 'No summary generated' };
    }

    return { success: true, summary };
  } catch (error: any) {
    return { success: false, error: `${provider} error: ${error.message}` };
  }
}

/**
 * Test AI connection
 */
export async function testAIConnection(): Promise<AISummaryResult> {
  const provider = getSetting('ai_provider') || 'ollama';
  const model = getSetting('ai_model') || 'llama3.2';

  const testContext = 'Date: 2026-01-03\nTotal active time: 1h 0m\nTop activities: Test\n\nTest connection.';

  if (provider === 'ollama') {
    return await generateWithOllama(model, testContext);
  } else {
    return await generateWithOpenAI(provider, model, testContext);
  }
}

