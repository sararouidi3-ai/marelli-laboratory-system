import { LabRequest } from "../types";

type SubscriptionCallback = (requests: LabRequest[]) => void;

class DbService {
  private listeners: Set<SubscriptionCallback> = new Set();
  private pollInterval: any = null;
  private cachedRequests: LabRequest[] = [];

  constructor() {
    // Start polling to detect modifications across multi-tabs or viewports immediately
    this.startPolling();
  }

  private startPolling() {
    if (typeof window === "undefined") return;
    
    // Initial fetch
    this.fetchAndNotify();

    // Poll every 3 seconds to keep tabs synchronized in real-time
    this.pollInterval = setInterval(() => {
      this.fetchAndNotify();
    }, 3000);
  }

  private async fetchAndNotify() {
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data: LabRequest[] = await res.json();
        this.cachedRequests = data;
        this.notifyAll();
      }
    } catch (err) {
      // Fail silently for background polls
    }
  }

  private notifyAll() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.cachedRequests);
      } catch (err) {
        console.error("Error invoking listener callback:", err);
      }
    });
  }

  public async getRequests(): Promise<LabRequest[]> {
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data = await res.json();
        this.cachedRequests = data;
        return data;
      }
    } catch (err) {
      console.error("Error fetching getRequests:", err);
    }
    return this.cachedRequests;
  }

  public async getRequest(id: string): Promise<LabRequest | null> {
    try {
      console.log("Searching Request:", id);
      const res = await fetch(`/api/requests/${encodeURIComponent(id)}`);
      if (res.ok) {
        const found = await res.json();
        console.log("Found matching request details:", found);
        return found;
      }
    } catch (err) {
      console.error("Error retrieving request details from API:", err);
    }
    return null;
  }

  public async saveRequest(request: LabRequest): Promise<void> {
    try {
      console.log("Request Created:", request.id);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        throw new Error("Failed to post request to server backend");
      }
      const saved = await res.json();
      
      // Update local cache and notify listeners immediately
      const index = this.cachedRequests.findIndex(r => r.id.toLowerCase() === request.id.toLowerCase());
      if (index >= 0) {
        this.cachedRequests[index] = saved;
      } else {
        this.cachedRequests.unshift(saved);
      }
      this.notifyAll();
    } catch (err) {
      console.error("Error saving request to backend:", err);
      throw err;
    }
  }

  public async updateRequest(id: string, updates: Partial<LabRequest>): Promise<void> {
    try {
      console.log("Updating request:", id, "with details:", updates);
      const res = await fetch(`/api/requests/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        throw new Error("Failed to put request update on server backend");
      }
      const updated = await res.json();
      
      // Update local cache and notify listeners immediately
      const index = this.cachedRequests.findIndex(r => r.id.toLowerCase() === id.toLowerCase());
      if (index >= 0) {
        this.cachedRequests[index] = { ...this.cachedRequests[index], ...updated };
      }
      this.notifyAll();
    } catch (err) {
      console.error("Error updating request on backend:", err);
      throw err;
    }
  }

  public subscribe(callback: SubscriptionCallback): () => void {
    this.listeners.add(callback);
    // Fire with current cache immediately
    callback(this.cachedRequests);
    
    // Fetch now to be fresh
    this.fetchAndNotify();

    return () => {
      this.listeners.delete(callback);
    };
  }

  public async countRequestsOnDate(dateFR: string): Promise<number> {
    try {
      const res = await fetch(`/api/requests/count/${encodeURIComponent(dateFR)}`);
      if (res.ok) {
        const body = await res.json();
        return body.count;
      }
    } catch (err) {
      console.error("Error fetching countRequestsOnDate:", err);
    }
    
    // Fallback to cache local search
    return this.cachedRequests.filter((r) => r.dateDemande === dateFR).length;
  }
}

export const dbService = new DbService();
