import { DBSchema, IDBPDatabase, openDB } from "idb";

interface SessionDBSchema extends DBSchema {
	"current-session": {
		key: string; // Fixný kľúč 'current'
		value: {
			sessionId: string;
			data: any;
			created: number;
			lastModified: number;
		};
	};
	"session-history": {
		key: string; // Auto-generated ID
		value: {
			id: string;
			sessionId: string;
			canvasData: string;
			thumbnail: string | null;
			timestamp: number;
			action?: string;
		};
		indexes: { "by-session": string };
	};
}

class SessionDBManager {
	private db: IDBPDatabase<SessionDBSchema> | null = null;
	private dbName = "artstudio-session-db";
	private dbVersion = 2;
	private currentSessionId: string | null = null;
	private isNewSession = false;
	private isInitialized = false;
	private isBrowser: boolean;

	// Memory storage fallback for non-browser environments
	private memoryStore: {
		"current-session": Map<string, any>;
		"session-history": Map<string, any>;
	} = {
		"current-session": new Map(),
		"session-history": new Map(),
	};

	constructor() {
		// Check if we're in a browser environment
		this.isBrowser =
			typeof window !== "undefined" && typeof indexedDB !== "undefined";
	}

	async init(): Promise<void> {
		if (this.isInitialized) return;

		if (!this.isBrowser) {
			console.warn(
				"IndexedDB is not available (non-browser environment), using memory storage",
			);
			this.isInitialized = true;
			return;
		}

		try {
			this.db = await openDB<SessionDBSchema>(this.dbName, this.dbVersion, {
				upgrade(db, oldVersion, newVersion, transaction) {
					// Create object stores
					if (!db.objectStoreNames.contains("current-session")) {
						db.createObjectStore("current-session");
					}

					if (!db.objectStoreNames.contains("session-history")) {
						const historyStore = db.createObjectStore("session-history", {
							keyPath: "id",
						});
						historyStore.createIndex("by-session", "sessionId");
					}
				},
			});
			this.isInitialized = true;
		} catch (error) {
			console.error("Failed to initialize IndexedDB:", error);
			this.isInitialized = true;
		}
	}

	async getDB(): Promise<IDBPDatabase<SessionDBSchema> | null> {
		if (!this.isInitialized) {
			await this.init();
		}
		return this.db;
	}

	async startNewSession(): Promise<string> {
		// Vygeneruj unikátny ID pre session
		const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.currentSessionId = sessionId;
		this.isNewSession = true;

		const db = await this.getDB();

		if (db) {
			// Ulož pod fixný kľúč 'current'
			await db.put(
				"current-session",
				{
					sessionId,
					data: null,
					created: Date.now(),
					lastModified: Date.now(),
				},
				"current",
			);
		} else {
			// Memory storage fallback
			this.memoryStore["current-session"].set("current", {
				sessionId,
				data: null,
				created: Date.now(),
				lastModified: Date.now(),
			});
		}
		return sessionId;
	}

	async getCurrentSession(): Promise<string | null> {
		if (this.currentSessionId) return this.currentSessionId;

		const db = await this.getDB();

		let session: any = null;

		if (db) {
			session = await db.get("current-session", "current");
		} else {
			session = this.memoryStore["current-session"].get("current");
		}

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

		if (db) {
			const existing = await db.get("current-session", "current");

			await db.put(
				"current-session",
				{
					sessionId: this.currentSessionId!,
					data,
					created: existing?.created || Date.now(),
					lastModified: Date.now(),
				},
				"current",
			);
		} else {
			// Memory storage fallback
			const existing = this.memoryStore["current-session"].get("current");
			this.memoryStore["current-session"].set("current", {
				sessionId: this.currentSessionId!,
				data,
				created: existing?.created || Date.now(),
				lastModified: Date.now(),
			});

			// Also save to localStorage if available for persistence
			if (typeof window !== "undefined" && window.localStorage) {
				try {
					localStorage.setItem(
						"artstudio-session-fallback",
						JSON.stringify({
							sessionId: this.currentSessionId,
							data,
							created: existing?.created || Date.now(),
							lastModified: Date.now(),
						}),
					);
				} catch (e) {
					// localStorage might be full or not available
				}
			}
		}
	}

	async loadSessionData(): Promise<any | null> {
		if (!this.currentSessionId) {
			await this.getCurrentSession();
		}

		const db = await this.getDB();

		if (db) {
			const session = await db.get("current-session", "current");
			return session?.data || null;
		} else {
			// Memory storage fallback
			const session = this.memoryStore["current-session"].get("current");

			// Try to load from localStorage if memory storage is empty
			if (!session && typeof window !== "undefined" && window.localStorage) {
				try {
					const fallback = localStorage.getItem("artstudio-session-fallback");
					if (fallback) {
						const parsed = JSON.parse(fallback);
						this.memoryStore["current-session"].set("current", parsed);
						return parsed.data;
					}
				} catch (e) {
					// Ignore localStorage errors
				}
			}

			return session?.data || null;
		}
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

		const historyEntry = {
			id,
			sessionId: this.currentSessionId!,
			canvasData: entry.canvasData,
			thumbnail: entry.thumbnail || null,
			timestamp: Date.now(),
			action: entry.action,
		};

		if (db) {
			await db.put("session-history", historyEntry);
			// Keep only last 50 entries for this session
			await this.trimHistory();
		} else {
			// Memory storage fallback
			this.memoryStore["session-history"].set(id, historyEntry);
			// Trim memory storage
			await this.trimMemoryHistory();
		}
	}

	async getHistory(limit: number = 20): Promise<any[]> {
		if (!this.currentSessionId) {
			await this.getCurrentSession();
		}

		const db = await this.getDB();

		if (db) {
			const transaction = db.transaction("session-history", "readonly");
			const store = transaction.objectStore("session-history");
			const index = store.index("by-session");

			const entries = await index.getAll(this.currentSessionId!);
			await transaction.done;

			return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
		} else {
			// Memory storage fallback
			const entries = Array.from(this.memoryStore["session-history"].values())
				.filter((entry) => entry.sessionId === this.currentSessionId)
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(0, limit);

			return entries;
		}
	}

	async deleteHistoryEntry(id: string): Promise<void> {
		const db = await this.getDB();

		if (db) {
			await db.delete("session-history", id);
		} else {
			// Memory storage fallback
			this.memoryStore["session-history"].delete(id);
		}
	}

	async deleteAllHistoryForSession(sessionId: string): Promise<void> {
		const db = await this.getDB();

		if (db) {
			const transaction = db.transaction("session-history", "readwrite");
			const store = transaction.objectStore("session-history");
			const index = store.index("by-session");

			let cursor = await index.openCursor(IDBKeyRange.only(sessionId));
			while (cursor) {
				await cursor.delete();
				cursor = await cursor.continue();
			}

			await transaction.done;
		} else {
			// Memory storage fallback
			for (const [key, entry] of this.memoryStore[
				"session-history"
			].entries()) {
				if (entry.sessionId === sessionId) {
					this.memoryStore["session-history"].delete(key);
				}
			}
		}
	}

	private async trimHistory(): Promise<void> {
		const db = await this.getDB();
		if (!db) return;

		const transaction = db.transaction("session-history", "readwrite");
		const store = transaction.objectStore("session-history");
		const index = store.index("by-session");

		// Fetch entries for the current session, sorted by timestamp desc (newest first)
		// We want to keep the newest 50 and delete the rest.
		let count = 0;
		let cursor = await index.openCursor(this.currentSessionId!, "prev");

		while (cursor) {
			count++;
			if (count > 50) {
				await cursor.delete();
			}
			cursor = await cursor.continue();
		}

		await transaction.done;
	}

	private async trimMemoryHistory(): Promise<void> {
		const entries = Array.from(
			this.memoryStore["session-history"].values(),
		).filter((entry) => entry.sessionId === this.currentSessionId);

		if (entries.length > 50) {
			const entriesToDelete = entries
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(50);

			for (const entry of entriesToDelete) {
				this.memoryStore["session-history"].delete(entry.id);
			}
		}
	}

	async clearSession(sessionId?: string): Promise<void> {
		const targetSessionId = sessionId || this.currentSessionId;
		if (!targetSessionId) return;

		const db = await this.getDB();

		if (db) {
			// Delete session data
			await db.delete("current-session", "current");

			// Delete session history
			const transaction = db.transaction("session-history", "readwrite");
			const store = transaction.objectStore("session-history");
			const index = store.index("by-session");

			let cursor = await index.openCursor(IDBKeyRange.only(targetSessionId));
			while (cursor) {
				await cursor.delete();
				cursor = await cursor.continue();
			}

			await transaction.done;
		} else {
			// Memory storage cleanup
			this.memoryStore["current-session"].delete("current");

			// Remove all history entries for this session
			for (const [key, entry] of this.memoryStore[
				"session-history"
			].entries()) {
				if (entry.sessionId === targetSessionId) {
					this.memoryStore["session-history"].delete(key);
				}
			}

			// Clear localStorage fallback
			if (typeof window !== "undefined" && window.localStorage) {
				localStorage.removeItem("artstudio-session-fallback");
			}
		}

		if (this.currentSessionId === targetSessionId) {
			this.currentSessionId = null;
			this.isNewSession = false;
		}
	}

	async clearAllSessions(): Promise<void> {
		const db = await this.getDB();

		if (db) {
			await db.clear("current-session");
			await db.clear("session-history");
		} else {
			// Clear memory storage
			this.memoryStore["current-session"].clear();
			this.memoryStore["session-history"].clear();

			// Clear localStorage fallback
			if (typeof window !== "undefined" && window.localStorage) {
				localStorage.removeItem("artstudio-session-fallback");
			}
		}

		this.currentSessionId = null;
		this.isNewSession = false;
	}

	async cleanupOldSessions(): Promise<void> {
		const db = await this.getDB();

		if (!db) {
			// For memory storage, just clear everything on page refresh
			this.memoryStore["session-history"].clear();
			return;
		}

		// First, get current session
		const currentSession = await db.get("current-session", "current");
		const currentSessionId = currentSession?.sessionId;

		// Get all sessions from history
		const transaction = db.transaction("session-history", "readonly");
		const store = transaction.objectStore("session-history");

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
			const sessionTransaction = db.transaction("session-history", "readonly");
			const sessionStore = sessionTransaction.objectStore("session-history");
			const sessionIndex = sessionStore.index("by-session");

			const sessionEntries = await sessionIndex.getAll(sessionId);
			await sessionTransaction.done;

			if (sessionEntries.length > 0) {
				const oldestEntry = sessionEntries.reduce((oldest, entry) =>
					entry.timestamp < oldest.timestamp ? entry : oldest,
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

		if (db) {
			const session = await db.get("current-session", "current");
			return !!session && !!session.data;
		} else {
			const session = this.memoryStore["current-session"].get("current");
			return !!session && !!session.data;
		}
	}

	// Get session info
	async getSessionInfo(): Promise<{
		sessionId: string | null;
		created: number | null;
		lastModified: number | null;
	}> {
		const db = await this.getDB();

		let session: any = null;

		if (db) {
			session = await db.get("current-session", "current");
		} else {
			session = this.memoryStore["current-session"].get("current");

			// Try localStorage fallback
			if (!session && typeof window !== "undefined" && window.localStorage) {
				try {
					const fallback = localStorage.getItem("artstudio-session-fallback");
					if (fallback) {
						session = JSON.parse(fallback);
					}
				} catch (e) {
					// Ignore errors
				}
			}
		}

		if (!session) {
			return { sessionId: null, created: null, lastModified: null };
		}

		return {
			sessionId: session.sessionId,
			created: session.created,
			lastModified: session.lastModified,
		};
	}

	// Method to check if we're using IndexedDB
	isUsingIndexedDB(): boolean {
		return this.isBrowser && this.db !== null;
	}

	// Method to get storage type for debugging
	getStorageType(): string {
		if (this.isBrowser && this.db) {
			return "IndexedDB";
		} else if (this.isBrowser) {
			return "Memory + localStorage fallback";
		} else {
			return "Memory storage (non-browser)";
		}
	}
}

export const sessionDB = new SessionDBManager();

// Auto-cleanup only in browser environment
if (typeof window !== "undefined") {
	// Initialize and cleanup on next tick to avoid blocking
	setTimeout(() => {
		sessionDB
			.init()
			.then(() => {
				if (sessionDB.isUsingIndexedDB()) {
					sessionDB.cleanupOldSessions().catch(console.error);
				}
			})
			.catch(console.error);
	}, 0);
}
