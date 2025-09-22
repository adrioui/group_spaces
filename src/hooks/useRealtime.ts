'use client';

import { useEffect, useRef } from 'react';
import { RealtimeManager, type RealtimeEvent } from '@/lib/realtime';

export function useRealtime(
  spaceId: number,
  eventHandler: (event: RealtimeEvent) => void,
  deps: any[] = []
) {
  const managerRef = useRef<RealtimeManager | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    const manager = new RealtimeManager();
    managerRef.current = manager;

    const unsubscribe = manager.subscribeToSpace(spaceId, eventHandler);
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (managerRef.current) {
        managerRef.current.unsubscribeAll();
        managerRef.current = null;
      }
    };
  }, [spaceId, ...deps]);
}