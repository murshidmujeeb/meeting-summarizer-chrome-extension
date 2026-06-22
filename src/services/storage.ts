import Dexie, { Table } from 'dexie';
import { SessionData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class MeetingSummarizerDB extends Dexie {
  sessions!: Table<SessionData, string>;
  models!: Table<any, string>;
  settings!: Table<any, string>;

  constructor() {
    super('MeetingTranscripts');
    this.version(1).stores({
      sessions: 'sessionId, createdAt',
      models: 'modelName',
      settings: 'id'
    });
  }
}

export const db = new MeetingSummarizerDB();

export class SessionManager {
  public async saveSession(sessionData: Omit<SessionData, 'sessionId'> & { sessionId?: string }): Promise<string> {
    const sessionId = sessionData.sessionId || uuidv4();
    const completeSession: SessionData = {
      ...sessionData,
      sessionId,
      updatedAt: Date.now()
    } as SessionData;

    await db.sessions.put(completeSession);
    return sessionId;
  }

  public async loadSession(sessionId: string): Promise<SessionData | undefined> {
    return await db.sessions.get(sessionId);
  }

  public async listSessions(limit: number = 50): Promise<SessionData[]> {
    return await db.sessions.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await db.sessions.delete(sessionId);
  }
}

export class SettingsManager {
  public async saveSettings(settings: any): Promise<void> {
    await chrome.storage.local.set({ 'extension-preferences': settings });
  }

  public async getSettings(): Promise<any> {
    const result = await chrome.storage.local.get('extension-preferences');
    return result['extension-preferences'] || {
      transcriptionEngine: 'webspeech',
      summaryLevel: 'short',
      autoSave: true,
      language: 'en-US',
      theme: 'light',
      fontSize: 14
    };
  }
}

export class ModelCache {
  public async cacheModel(modelName: string, modelData: Blob, checksum: string, version: string): Promise<void> {
    await db.models.put({
      modelName,
      modelData,
      checksum,
      downloadedAt: Date.now(),
      version
    });
  }

  public async getModel(modelName: string): Promise<any> {
    return await db.models.get(modelName);
  }
}
