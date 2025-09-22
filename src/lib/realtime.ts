import { supabase, type SupabaseClient } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeEvent {
  type: 'message:new' | 'note:created' | 'note:updated' | 'note:deleted' | 'member:joined' | 'member:left' | 'progress:updated';
  payload: any;
  spaceId?: number;
}

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private eventHandlers: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();

  constructor(private client: SupabaseClient = supabase) {}

  subscribeToSpace(spaceId: number, eventHandler: (event: RealtimeEvent) => void): () => void {
    const channelName = `space:${spaceId}`;

    if (!this.eventHandlers.has(channelName)) {
      this.eventHandlers.set(channelName, new Set());
    }

    this.eventHandlers.get(channelName)!.add(eventHandler);

    if (!this.channels.has(channelName)) {
      const channel = this.client.channel(channelName);

      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `space_id=eq.${spaceId}`,
        }, (payload) => {
          this.emit(channelName, {
            type: 'message:new',
            payload: payload.new,
            spaceId,
          });
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter: `space_id=eq.${spaceId}`,
        }, (payload) => {
          this.emit(channelName, {
            type: 'note:created',
            payload: payload.new,
            spaceId,
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `space_id=eq.${spaceId}`,
        }, (payload) => {
          this.emit(channelName, {
            type: 'note:updated',
            payload: payload.new,
            spaceId,
          });
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'notes',
          filter: `space_id=eq.${spaceId}`,
        }, (payload) => {
          this.emit(channelName, {
            type: 'note:deleted',
            payload: payload.old,
            spaceId,
          });
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'space_members',
          filter: `space_id=eq.${spaceId}`,
        }, (payload) => {
          this.emit(channelName, {
            type: 'member:joined',
            payload: payload.new,
            spaceId,
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'space_members',
          filter: `space_id=eq.${spaceId}`,
        }, (payload) => {
          this.emit(channelName, {
            type: payload.new.status === 'left' ? 'member:left' : 'member:joined',
            payload: payload.new,
            spaceId,
          });
        })
        .on('postgres_changes', {
          event: 'INSERT' as any,
          schema: 'public',
          table: 'progress',
          filter: `lesson_id=in.(select id from lessons where space_id=eq.${spaceId})`,
        }, (payload) => {
          this.emit(channelName, {
            type: 'progress:updated',
            payload: payload.new,
            spaceId,
          });
        })
        .subscribe((status) => {
          console.log(`Realtime subscription status for ${channelName}:`, status);
        });

      this.channels.set(channelName, channel);
    }

    return () => {
      const handlers = this.eventHandlers.get(channelName);
      if (handlers) {
        handlers.delete(eventHandler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(channelName);
        }
      }

      if (this.eventHandlers.size === 0 && this.channels.has(channelName)) {
        this.channels.get(channelName)!.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  private emit(channelName: string, event: RealtimeEvent) {
    const handlers = this.eventHandlers.get(channelName);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  async broadcastToSpace(spaceId: number, event: Omit<RealtimeEvent, 'spaceId'>) {
    const channelName = `space:${spaceId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload,
      });
    }
  }

  unsubscribeAll() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.eventHandlers.clear();
  }
}

export const realtimeManager = new RealtimeManager();