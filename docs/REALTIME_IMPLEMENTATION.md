# Realtime Implementation Guide

## Overview

This document explains the Supabase Realtime implementation that replaces the previous polling-based system with WebSocket-powered real-time updates.

## Architecture

### Core Components

1. **Supabase Client** (`src/lib/supabase.ts`)
   - Configures Supabase client with Realtime capabilities
   - Provides both client and service-level clients

2. **Realtime Manager** (`src/lib/realtime.ts`)
   - Manages WebSocket subscriptions to database changes
   - Handles different event types (messages, notes, members, progress)
   - Provides subscription lifecycle management

3. **Custom Hook** (`src/hooks/useRealtime.ts`)
   - React hook for subscribing to real-time events
   - Handles cleanup and memory management

## Event Types

The system supports the following real-time events:

### Message Events
- `message:new` - Triggered when a new message is sent in a space

### Note Events
- `note:created` - Triggered when a new note is created
- `note:updated` - Triggered when a note is modified
- `note:deleted` - Triggered when a note is deleted

### Member Events
- `member:joined` - Triggered when a user joins a space
- `member:left` - Triggered when a user leaves a space

### Progress Events
- `progress:updated` - Triggered when lesson progress changes

## Usage Examples

### Chat Component
```typescript
useRealtime(spaceId, (event: RealtimeEvent) => {
  if (event.type === 'message:new') {
    setMessages(prev => [event.payload, ...prev]);
  }
}, [spaceId]);
```

### Notes Component
```typescript
useRealtime(spaceId, (event: RealtimeEvent) => {
  if (event.type === 'note:created' || event.type === 'note:updated') {
    setNotes(prev => {
      const existingIndex = prev.findIndex(n => n.id === event.payload.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = event.payload;
        return updated;
      }
      return [event.payload, ...prev];
    });
  } else if (event.type === 'note:deleted') {
    setNotes(prev => prev.filter(n => n.id !== event.payload.id));
  }
}, [spaceId]);
```

## Database Requirements

### Enable Realtime on Tables
For Supabase Realtime to work, the following tables must have Realtime enabled:

```sql
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE notes REPLICA IDENTITY FULL;
ALTER TABLE space_members REPLICA IDENTITY FULL;
ALTER TABLE progress REPLICA IDENTITY FULL;
```

### Database Setup
1. Enable Realtime in your Supabase project settings
2. Ensure proper RLS (Row Level Security) policies are in place
3. Set up the database tables with the correct schema

## Performance Considerations

### Connection Management
- Each space gets its own WebSocket channel
- Channels are automatically cleaned up when no subscribers remain
- Maximum of 10 events per second per channel

### Memory Management
- Subscriptions are automatically cleaned up when components unmount
- Event handlers are properly tracked and removed
- No memory leaks from dangling subscriptions

## Migration from Polling

### Before (Polling)
```typescript
useEffect(() => {
  load();
  const id = setInterval(load, 5000);
  return () => clearInterval(id);
}, [load]);
```

### After (Realtime)
```typescript
useEffect(() => {
  load();
}, [load]);

useRealtime(spaceId, (event: RealtimeEvent) => {
  if (event.type === 'message:new') {
    setMessages(prev => [event.payload, ...prev]);
  }
}, [spaceId]);
```

## Benefits

1. **Instant Updates**: Messages appear immediately without delay
2. **Reduced Bandwidth**: No more repeated HTTP requests every 5 seconds
3. **Better UX**: Real-time collaboration feels more natural
4. **Scalability**: WebSocket connections are more efficient than polling
5. **Battery Life**: Less network activity on mobile devices

## Testing

### Manual Testing
1. Open two browser tabs with the same space
2. Send a message in one tab
3. Verify it appears instantly in the other tab
4. Test with notes creation, updates, and deletion
5. Test member joining and leaving

### Browser DevTools
- Check the Network tab for WebSocket connections
- Monitor the Console for Realtime connection status
- Verify no repeated HTTP requests for polling

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify Supabase URL and API keys
2. **No Events**: Ensure Realtime is enabled in Supabase project settings
3. **Permission Errors**: Check RLS policies for table access
4. **Memory Leaks**: Verify components properly clean up subscriptions

### Debug Mode
Enable debug logging by adding this to your Supabase client:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  debug: true, // Add this for debugging
});
```

## Next Steps

1. Set up Supabase project and database
2. Configure environment variables
3. Enable Realtime on required tables
4. Test all real-time features
5. Monitor performance and optimize as needed