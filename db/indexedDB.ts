import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface SessionDBSchema extends DBSchema {
  'current-session': {
    key: string;
    value: {
      sessionId: string;
      data: any;
      created: number;
      lastModified: number;
    };
  };
  'session-history': {
    key: string;
    value: {
      id: string;
      sessionId: string;
      canvasData: string;
      thumbnail: string | null;
      timestamp: number;
      action?: string;
    };
    indexes: { 'by-session': string };
  };
}

class SessionDBManager {
  private db: IDBPDatabase<SessionDBSchema> | null = null;
  private dbName = 'artstudio-session-db';
  private dbVersion = 1;
  private currentSessionId: string | null = null;
  private isNewSession = false;

  async init(): Promise<void> {
    this.db = await openDB<SessionDBSchema>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion) {
        if (!db.objectStoreNames.contains('current-session')) {
          db.createObjectStore('current-session');
        }
        if (!db.objectStoreNames.contains('session-history')) {
          const historyStore = db.createObjectStore('session-history', { keyPath: 'id' });
          historyStore.createIndex('by-session', 'sessionId');
        }
      },
    });
  }

  async getDB(): Promise<IDBPDatabase<SessionDBSchema>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async startNewSession(): Promise<string> {
    const db = await this.getDB();
    
    // Vygeneruj unikátny ID pre session
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentSessionId = sessionId;
    this.isNewSession = true;
    
    // Ulož prázdnu session
    await db.put('current-session', 'current', {
      sessionId,
      data: null,
      created: Date.now(),
      lastModified: Date.now(),
    });
    
    console.log('Started new session:', sessionId);
    return sessionId;
  }

  async getCurrentSession(): Promise<string | null> {
    if (this.currentSessionId) return this.currentSessionId;
    
    const db = await this.getDB();
    const session = await db.get('current-session', 'current');
    
    if (session) {
      // Check if session is older than 24 hours (expired)
      const isExpired = Date.now() - session.created > 24 * 60 * 60 * 1000;
      
      if (isExpired) {
        // Delete expired session and start new one
        await this.clearSession(session.sessionId);
        return await this.startNewSession();
      }
      
      this.currentSessionId = session.sessionId;
      this.isNewSession = false;
      return session.sessionId;
    }
    
    // No existing session, create new one
    return await this.startNewSession();
  }

  async saveSessionData(data: any): Promise<void> {
    if (!this.currentSessionId) {
      await this.getCurrentSession();
    }
    
    const db = await this.getDB();
    await db.put('current-session', 'current', {
      sessionId: this.currentSessionId!,
      data,
      created: this.isNewSession ? Date.now() : (await db.get('current-session', 'current'))?.created || Date.now(),
      lastModified: Date.now(),
    });
  }

  async loadSessionData(): Promise<any | null> {
    if (!this.currentSessionId) {
      await this.getCurrentSession();
    }
    
    const db = await this.getDB();
    const session = await db.get('current-session', 'current');
    return session?.data || null;
  }

  async addHistoryEntry(entry: {
    canvasData: string;
    thumbnail?: string;
    action?: string;
  }): Promise<void> {
    if (!this.currentSessionId) {
      await this.getCurrentSession();
    }
    
    const db = await this.getDB();
    const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.put('session-history', {
      id,
      sessionId: this.currentSessionId!,
      canvasData: entry.canvasData,
      thumbnail: entry.thumbnail || null,
      timestamp: Date.now(),
      action: entry.action,
    });
    
    // Keep only last 50 entries for this session
    await this.trimHistory();
  }

  async getHistory(limit: number = 20): Promise<any[]> {
    if (!this.currentSessionId) {
      await this.getCurrentSession();
    }
    
    const db = await this.getDB();
    const index = db.transaction('session-history', 'readonly').store.index('by-session');
    const entries = await index.getAll(this.currentSessionId!);
    
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  private async trimHistory(): Promise<void> {
    const db = await this.getDB();
    const index = db.transaction('session-history', 'readwrite').store.index('by-session');
    const entries = await index.getAll(this.currentSessionId!);
    
    if (entries.length > 50) {
      entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(50)
        .forEach(async (entry) => {
          await db.delete('session-history', entry.id);
        });
    }
  }

  async clearSession(sessionId?: string): Promise<void> {
    const db = await this.getDB();
    
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return;
    
    // Delete session data
    await db.delete('current-session', 'current');
    
    // Delete session history
    const transaction = db.transaction('session-history', 'readwrite');
    const store = transaction.objectStore('session-history');
    const index = store.index('by-session');
    
    let cursor = await index.openCursor(targetSessionId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    
    await transaction.done;
    
    if (this.currentSessionId === targetSessionId) {
      this.currentSessionId = null;
      this.isNewSession = false;
    }
    
    console.log('Cleared session:', targetSessionId);
  }

  async clearAllSessions(): Promise<void> {
    const db = await this.getDB();
    await db.clear('current-session');
    await db.clear('session-history');
    this.currentSessionId = null;
    this.isNewSession = false;
    console.log('Cleared all sessions');
  }

  async cleanupOldSessions(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction('session-history', 'readonly');
    const store = transaction.objectStore('session-history');
    
    // Get all unique session IDs from history
    const sessions = new Set<string>();
    let cursor = await store.openCursor();
    while (cursor) {
      sessions.add(cursor.value.sessionId);
      cursor = await cursor.continue();
    }
    
    // Check each session if it has current data
    for (const sessionId of sessions) {
      const hasCurrentSession = await db.get('current-session', 'current');
      
      // If session is not current and is old (> 24h), delete it
      if (!hasCurrentSession || hasCurrentSession.sessionId !== sessionId) {
        const sessionEntries = await store.index('by-session').getAll(sessionId);
        if (sessionEntries.length > 0) {
          const oldestEntry = sessionEntries.reduce((oldest, entry) => 
            entry.timestamp < oldest.timestamp ? entry : oldest
          );
          
          // Delete if older than 24 hours
          if (Date.now() - oldestEntry.timestamp > 24 * 60 * 60 * 1000) {
            await this.clearSession(sessionId);
          }
        }
      }
    }
  }
}

export const sessionDB = new SessionDBManager();

// Auto-cleanup on init
sessionDB.init().then(() => {
  sessionDB.cleanupOldSessions().catch(console.error);
});