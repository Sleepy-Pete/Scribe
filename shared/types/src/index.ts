// Shared TypeScript types for the activity tracker

export type EventKind = 'app' | 'web' | 'call';

export type CallProvider = 'meet' | 'discord' | 'zoom' | 'slack' | 'other';

export interface ActivityEvent {
  id?: number;
  kind: EventKind;
  app_name?: string;
  process_name?: string;
  window_title?: string;
  url?: string;
  domain?: string;
  call_provider?: CallProvider;
  start_ts: number; // unix milliseconds
  end_ts: number; // unix milliseconds
  active_seconds: number;
  privacy_redacted?: boolean;
}

export interface Setting {
  key: string;
  value: string;
}

export interface ActiveWindowInfo {
  app_name: string;
  process_name: string;
  window_title: string;
  timestamp: number;
}

export interface BrowserTabInfo {
  url: string;
  domain: string;
  title: string;
  timestamp: number;
  focused: boolean;
}

export interface SessionConfig {
  polling_interval_ms: number;
  idle_timeout_seconds: number;
  privacy_mode: boolean;
}

export interface DailyStats {
  date: string;
  total_active_seconds: number;
  app_switches: number;
  top_apps: Array<{ app_name: string; active_seconds: number }>;
  top_sites: Array<{ domain: string; active_seconds: number }>;
  calls: Array<{
    call_provider: CallProvider;
    start_ts: number;
    end_ts: number;
    duration_seconds: number;
  }>;
}

export interface TimelineBlock {
  kind: EventKind;
  label: string; // app_name or domain
  detail?: string; // window_title or url
  start_ts: number;
  end_ts: number;
  active_seconds: number;
  call_provider?: CallProvider;
}

export interface ObsidianSettings {
  vault_path: string;
  auto_export: boolean;
  export_time: string; // HH:MM format
}

export interface ObsidianExportResult {
  success: boolean;
  file_path?: string;
  error?: string;
}

export interface DateSummary {
  date: string; // YYYY-MM-DD format
  event_count: number;
  total_active_seconds: number;
}

