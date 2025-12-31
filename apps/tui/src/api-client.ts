import axios, { AxiosInstance } from 'axios';
import { DailyStats, TimelineBlock } from '@scribe/types';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000
    });
  }

  async getHealth(): Promise<{ status: string; database: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getTimeline(): Promise<TimelineBlock[]> {
    const response = await this.client.get('/api/timeline/today');
    return response.data.timeline;
  }

  async getDailyStats(date?: string): Promise<DailyStats> {
    const params = date ? { date } : {};
    const response = await this.client.get('/api/stats/daily', { params });
    return response.data;
  }

  async getSettings(): Promise<Record<string, string>> {
    const response = await this.client.get('/api/settings');
    return response.data.settings;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await this.client.put(`/api/settings/${key}`, { value });
  }

  async exportToObsidian(date: string): Promise<{ success: boolean; file_path?: string; error?: string }> {
    const response = await this.client.post('/api/obsidian/export', { date });
    return response.data;
  }

  async getJiraIssues(): Promise<any[]> {
    const response = await this.client.get('/api/jira/issues');
    return response.data.issues || [];
  }
}

