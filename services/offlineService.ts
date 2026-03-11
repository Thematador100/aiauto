// Offline Mode Service with Auto-Sync
// Allows inspectors to work without internet and sync when connected

import { supabaseConfig } from '../config/supabase';

interface QueuedInspection {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineService {
  private readonly STORAGE_KEY = 'offline_inspections';
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private syncTimer: number | null = null;

  constructor() {
    this.initializeServiceWorker();
    this.startAutoSync();
    this.setupOnlineListener();
  }

  /**
   * Initialize service worker for offline caching
   */
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Save inspection to local storage for offline use
   */
  async saveOffline(inspectionData: any): Promise<string> {
    const id = this.generateId();
    const inspection: QueuedInspection = {
      id,
      data: inspectionData,
      timestamp: Date.now(),
      synced: false,
    };

    const queue = this.getQueue();
    queue.push(inspection);
    this.saveQueue(queue);

    console.log(`Inspection ${id} saved offline`);
    return id;
  }

  /**
   * Get all offline inspections
   */
  getOfflineInspections(): QueuedInspection[] {
    return this.getQueue().filter(i => !i.synced);
  }

  /**
   * Sync all offline inspections to server
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      console.log('Cannot sync: offline');
      return { success: 0, failed: 0 };
    }

    const queue = this.getQueue();
    const unsynced = queue.filter(i => !i.synced);

    if (unsynced.length === 0) {
      console.log('No inspections to sync');
      return { success: 0, failed: 0 };
    }

    console.log(`Syncing ${unsynced.length} inspections...`);

    let success = 0;
    let failed = 0;

    for (const inspection of unsynced) {
      try {
        await this.syncInspection(inspection);
        inspection.synced = true;
        success++;
      } catch (error) {
        console.error(`Failed to sync inspection ${inspection.id}:`, error);
        failed++;
      }
    }

    this.saveQueue(queue);
    console.log(`Sync complete: ${success} success, ${failed} failed`);

    return { success, failed };
  }

  /**
   * Sync single inspection to server
   */
  private async syncInspection(inspection: QueuedInspection): Promise<void> {
    const SUPABASE_URL = supabaseConfig.url;
    const SUPABASE_ANON_KEY = supabaseConfig.anonKey;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/inspections`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(inspection.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  /**
   * Start automatic sync when online
   */
  private startAutoSync() {
    this.syncTimer = window.setInterval(() => {
      if (navigator.onLine) {
        this.syncAll();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Setup listener for online/offline events
   */
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('Connection restored, syncing...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, switching to offline mode');
    });
  }

  /**
   * Get sync queue from localStorage
   */
  private getQueue(): QueuedInspection[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Save sync queue to localStorage
   */
  private saveQueue(queue: QueuedInspection[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get pending sync count
   */
  getPendingCount(): number {
    return this.getOfflineInspections().length;
  }

  /**
   * Get all reports (for CustomerDashboard)
   */
  async getReports(): Promise<any[]> {
    const queue = this.getQueue();
    return queue.map(item => item.data);
  }

  /**
   * Save report (for FinalizeScreen)
   */
  async saveReport(reportData: any): Promise<string> {
    return this.saveOffline(reportData);
  }

  /**
   * Clear synced inspections from storage
   */
  clearSynced() {
    const queue = this.getQueue().filter(i => !i.synced);
    this.saveQueue(queue);
  }

  /**
   * Stop auto-sync
   */
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

export const offlineService = new OfflineService();
