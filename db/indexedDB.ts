import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface SessionDBSchema extends DBSchema {
  'current-session': {
    key: string; // Fixný kľúč 'current'
    value: {
      sessionId: string;
      data: any;
      created: number;
      lastModified: number;
    };
  };
  'session-history': {
    key: string; // Auto-generated ID
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
  private dbVersion = 2;
  private currentSessionId: string | null = null;
  private isNewSession = false;

  async init(): Promise<void> {
    this.db = await openDB<SessionDBSchema>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create object stores
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
    
    // Ulož pod fixný kľúč 'current'
    await db.put('current-session', {
      sessionId,
      data: null,
      created: Date.now(),
      lastModified: Date.now(),
    }, 'current');
    
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
    const existing = await db.get('current-session', 'current');
    
    await db.put('current-session', {
      sessionId: this.currentSessionId!,
      data,
      created: existing?.created || Date.now(),
      lastModified: Date.now(),
    }, 'current');
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
    const transaction = db.transaction('session-history', 'readonly');
    const store = transaction.objectStore('session-history');
    const index = store.index('by-session');
    
    const entries = await index.getAll(this.currentSessionId!);
    await transaction.done;
    
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  private async trimHistory(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction('session-history', 'readonly');
    const store = transaction.objectStore('session-history');
    const index = store.index('by-session');
    
    const entries = await index.getAll(this.currentSessionId!);
    await transaction.done;
    
    if (entries.length > 50) {
      const entriesToDelete = entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(50);
      
      const deleteTransaction = db.transaction('session-history', 'readwrite');
      const deleteStore = deleteTransaction.objectStore('session-history');
      
      for (const entry of entriesToDelete) {
        await deleteStore.delete(entry.id);
      }
      
      await deleteTransaction.done;
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
    
    let cursor = await index.openCursor(IDBKeyRange.only(targetSessionId));
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
    
    // First, get current session
    const currentSession = await db.get('current-session', 'current');
    const currentSessionId = currentSession?.sessionId;
    
    // Get all sessions from history
    const transaction = db.transaction('session-history', 'readonly');
    const store = transaction.objectStore('session-history');
    
    const sessions = new Set<string>();
    let cursor = await store.openCursor();
    while (cursor) {
      sessions.add(cursor.value.sessionId);
      cursor = await cursor.continue();
    }
    
    await transaction.done;
    
    // Check each session if it's old
    for (const sessionId of sessions) {
      // Skip current session
      if (sessionId === currentSessionId) continue;
      
      // Get oldest entry for this session
      const sessionTransaction = db.transaction('session-history', 'readonly');
      const sessionStore = sessionTransaction.objectStore('session-history');
      const sessionIndex = sessionStore.index('by-session');
      
      const sessionEntries = await sessionIndex.getAll(sessionId);
      await sessionTransaction.done;
      
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

  // Helper method to check if we have any saved data
  async hasSavedData(): Promise<boolean> {
    const db = await this.getDB();
    const session = await db.get('current-session', 'current');
    return !!session && !!session.data;
  }

  // Get session info
  async getSessionInfo(): Promise<{ sessionId: string | null; created: number | null; lastModified: number | null }> {
    const db = await this.getDB();
    const session = await db.get('current-session', 'current');
    
    if (!session) {
      return { sessionId: null, created: null, lastModified: null };
    }
    
    return {
      sessionId: session.sessionId,
      created: session.created,
      lastModified: session.lastModified,
    };
  }
}

export const sessionDB = new SessionDBManager();

// Auto-cleanup on init
sessionDB.init().then(() => {
  sessionDB.cleanupOldSessions().catch(console.error);
});