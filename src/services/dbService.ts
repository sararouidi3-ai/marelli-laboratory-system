import { supabase } from "../lib/supabase";
import { LabRequest } from "../types";

type SubscriptionCallback = (requests: LabRequest[]) => void;

class DbService {
  private listeners = new Set<SubscriptionCallback>();

  private notify(requests: LabRequest[]) {
    this.listeners.forEach(cb => cb(requests));
  }

  async getRequests(): Promise<LabRequest[]> {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data as LabRequest[];
  }

  async getRequest(id: string): Promise<LabRequest | null> {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data as LabRequest;
  }

  async saveRequest(request: LabRequest): Promise<void> {
    const { error } = await supabase
      .from("requests")
      .insert(request);

    if (error) throw error;

    this.notify(await this.getRequests());
  }

  async updateRequest(id: string, updates: Partial<LabRequest>): Promise<void> {
    const { error } = await supabase
      .from("requests")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    this.notify(await this.getRequests());
  }

  async countRequestsOnDate(date: string): Promise<number> {
    const { count } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("dateDemande", date);

    return count || 0;
  }

  subscribe(callback: SubscriptionCallback) {
    this.listeners.add(callback);

    this.getRequests().then(callback);

    const channel = supabase
      .channel("requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        async () => {
          callback(await this.getRequests());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      this.listeners.delete(callback);
    };
  }
}

export const dbService = new DbService();