import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface ArtStudioDBSchema extends DBSchema {
  'app-state': {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  'canvas-history': {
    key: string;
    value: {
      id: string;
      canvasData: string;
      thumbnail: string | null;
      timestamp: number;
      action?: string;
    };
    indexes: { 'by-timestamp': number };
  };
  'loaded-images': {
    key: string;
    value: {
      id: string;
      src: string;
      name: string;
      blob?: Blob;
      timestamp: number;
    };
  };
  'gradients': {
    key: string;
    value: {
      id: string;
      gradient: any;
      timestamp: number;
    };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<ArtStudioDBSchema> | null = null;
  private dbName = 'artstudio-db';
  private dbVersion = 3;

  async init(): Promise<void> {
    this.db = await openDB<ArtStudioDBSchema>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create object stores
        if (!db.objectStoreNames.contains('app-state')) {
          db.createObjectStore('app-state');
        }
        
        if (!db.objectStoreNames.contains('canvas-history')) {
          const historyStore = db.createObjectStore('canvas-history', { keyPath: 'id' });
          historyStore.createIndex('by-timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('loaded-images')) {
          db.createObjectStore('loaded-images', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('gradients')) {
          db.createObjectStore('gradients', { keyPath: 'id' });
        }
      },
    });
  }

  async getDB(): Promise<IDBPDatabase<ArtStudioDBSchema>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // App state methods
  async saveAppState(state: any): Promise<void> {
    const db = await this.getDB();
    const serializableState = this.serializeState(state);
    await db.put('app-state', {
      id: 'current-state',
      data: serializableState,
      timestamp: Date.now(),
    });
  }

  async loadAppState(): Promise<any | null> {
    const db = await this.getDB();
    const state = await db.get('app-state', 'current-state');
    return state ? this.deserializeState(state.data) : null;
  }

  // Canvas history methods
  async saveCanvasHistory(entry: {
    canvasData: string;
    thumbnail?: string;
    action?: string;
  }): Promise<string> {
    const db = await this.getDB();
    const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.put('canvas-history', {
      id,
      canvasData: entry.canvasData,
      thumbnail: entry.thumbnail || null,
      timestamp: Date.now(),
      action: entry.action,
    });

    // Keep only last 100 history entries
    await this.trimHistory();
    
    return id;
  }

  async getCanvasHistory(limit: number = 50): Promise<any[]> {
    const db = await this.getDB();
    const transaction = db.transaction('canvas-history', 'readonly');
    const store = transaction.objectStore('canvas-history');
    const index = store.index('by-timestamp');
    
    const entries = await index.getAll();
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async clearCanvasHistory(): Promise<void> {
    const db = await this.getDB();
    await db.clear('canvas-history');
  }

  private async trimHistory(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction('canvas-history', 'readwrite');
    const store = transaction.objectStore('canvas-history');
    const index = store.index('by-timestamp');
    
    const entries = await index.getAll();
    if (entries.length > 100) {
      entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(100)
        .forEach(async (entry) => {
          await store.delete(entry.id);
        });
    }
  }

  // Image methods
  async saveImage(image: { id: string; src: string; name: string; blob?: Blob }): Promise<void> {
    const db = await this.getDB();
    
    // Convert data URL to blob if needed
    let blob = image.blob;
    if (!blob && image.src.startsWith('data:')) {
      blob = await this.dataURLToBlob(image.src);
    }
    
    await db.put('loaded-images', {
      id: image.id,
      src: image.src,
      name: image.name,
      blob,
      timestamp: Date.now(),
    });
  }

  async loadImages(): Promise<Array<{ id: string; src: string; name: string }>> {
    const db = await this.getDB();
    const images = await db.getAll('loaded-images');
    
    // Convert blobs back to data URLs
    return await Promise.all(
      images.map(async (img) => {
        if (img.blob) {
          const dataUrl = await this.blobToDataURL(img.blob);
          return {
            id: img.id,
            src: dataUrl,
            name: img.name,
          };
        }
        return {
          id: img.id,
          src: img.src,
          name: img.name,
        };
      })
    );
  }

  async clearImages(): Promise<void> {
    const db = await this.getDB();
    await db.clear('loaded-images');
  }

  // Gradient methods
  async saveGradients(gradients: any[]): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction('gradients', 'readwrite');
    const store = transaction.objectStore('gradients');
    
    // Clear existing gradients
    await store.clear();
    
    // Save new gradients
    for (const gradient of gradients) {
      await store.put({
        id: gradient.id,
        gradient,
        timestamp: Date.now(),
      });
    }
  }

  async loadGradients(): Promise<any[]> {
    const db = await this.getDB();
    const gradients = await db.getAll('gradients');
    return gradients.map(g => g.gradient);
  }

  // Utility methods
  private async dataURLToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  private async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private serializeState(state: any): any {
    // Create a deep copy and remove circular references
    const { history, canvasData, ...rest } = state;
    
    return {
      ...rest,
      // Don't save canvas data in app state - it's stored separately
      history: [],
    };
  }

  private deserializeState(state: any): any {
    return state;
  }

  // Database maintenance
  async clearAll(): Promise<void> {
    const db = await this.getDB();
    await Promise.all([
      db.clear('app-state'),
      db.clear('canvas-history'),
      db.clear('loaded-images'),
      db.clear('gradients'),
    ]);
  }

  async getDatabaseSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
}

export const indexedDBManager = new IndexedDBManager();