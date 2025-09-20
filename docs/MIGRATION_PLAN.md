# Migration Plan: Turso → Supabase Realtime with Context-Engineering Patterns

## Executive Summary

This plan outlines the migration from Turso (SQLite) to Supabase (PostgreSQL) with Realtime capabilities, incorporating architectural patterns inspired by Context-Engineering's focus on **first-principles design**, **context optimization**, and **systematic organization**.

## Current Architecture Assessment

### Database Stack
- **Current**: Turso (SQLite) with Drizzle ORM
- **Target**: Supabase (PostgreSQL) with Drizzle ORM + Realtime
- **Auth**: Better Auth with Drizzle adapter
- **Realtime**: Polling-based (5-second intervals)

### Key Components to Migrate
1. Database layer (SQLite → PostgreSQL)
2. Realtime infrastructure (Polling → WebSockets)
3. Event-driven architecture
4. Context management patterns

---

## Phase 1: Foundation & Dependencies

### 1.1 Environment Setup
```bash
# Install required packages
npm install @supabase/supabase-js drizzle-orm pg --legacy-peer-deps
npm uninstall @libsql/client

# Update .env file
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Remove Turso variables
```

### 1.2 Database Configuration
**Files to modify:**
- `src/db/index.ts` - Migration to PostgreSQL
- `drizzle.config.ts` - PostgreSQL configuration
- Create migration scripts for schema transition

---

## Phase 2: Database Migration Strategy

### 2.1 Schema Migration
**Current SQLite → PostgreSQL mapping:**
```sql
-- SQLite (current)
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT...);

-- PostgreSQL (target)
CREATE TABLE users (id SERIAL PRIMARY KEY...);
```

### 2.2 Realtime Enablement
**Add to key tables:**
```sql
ALTER TABLE spaces ADD COLUMN enable_realtime BOOLEAN DEFAULT true;
ALTER TABLE messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE notes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

### 2.3 Migration Scripts
```bash
# Generate PostgreSQL migrations
npx drizzle-kit generate:pg

# Push schema to Supabase
npx drizzle-kit push:pg

# Data migration script (if needed)
npm run migrate:data
```

---

## Phase 3: Context-Engineering Architecture Implementation

### 3.1 Context-Aware Architecture
Inspired by Context-Engineering's systematic approach:

```
src/
├── context/                 # New: Context management
│   ├── realtime/           # Realtime event context
│   ├── database/           # Database access context
│   └── auth/              # Authentication context
├── hooks/                 # Enhanced custom hooks
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── realtime.ts       # Realtime utilities
└── components/
    └── realtime/         # Realtime UI components
```

### 3.2 Realtime Context Pattern
```typescript
// src/context/realtime/RealtimeContext.ts
type RealtimeContext = {
  subscriptions: Map<string, RealtimeChannel>;
  events: Subject<RealtimeEvent>;
  subscribe: (table: string, callback: EventCallback) => () => void;
  broadcast: (event: RealtimeEvent) => void;
};
```

---

## Phase 4: Realtime Implementation Strategy

### 4.1 Core Realtime Features
**Priority order (Context-Engineering inspired):**

1. **Chat Messages** (highest frequency, core UX)
2. **Presence & Typing Indicators**
3. **Note Publishing Events**
4. **Lesson Progress Updates**
5. **Space Member Changes**

### 4.2 Event-Driven Architecture
```typescript
// Event types following Context-Engineering systematic approach
type RealtimeEvent =
  | { type: 'message:new'; payload: Message }
  | { type: 'note:published'; payload: Note }
  | { type: 'progress:updated'; payload: Progress }
  | { type: 'presence:changed'; payload: Presence };
```

---

## Phase 5: Component Integration

### 5.1 Migration Order
1. **Database Layer** (foundation)
2. **Auth Integration** (ensure compatibility)
3. **Realtime Infrastructure**
4. **Component-by-Component Migration**
5. **Testing & Optimization**

### 5.2 Key Integration Points
- Replace polling in `src/app/spaces/[id]/page.tsx` chat
- Update note editor for real-time collaboration
- Enhance lesson progress with live updates
- Add presence indicators to member lists

---

## Phase 6: Context Optimization (Context-Engineering Inspired)

### 6.1 Performance Optimizations
```typescript
// Efficient subscription management
const subscriptionManager = new SubscriptionManager({
  maxSubscriptions: 50,
  cleanupInterval: 30000,
  priorityQueue: true
});
```

### 6.2 Memory Management
- Cleanup stale subscriptions
- Optimize message history retention
- Implement smart reconnection strategies

---

## Phase 7: Testing & Validation

### 7.1 Migration Testing
1. **Data Integrity**: Verify all data migrates correctly
2. **Realtime Functionality**: Test all event types
3. **Performance**: Benchmark against current polling system
4. **Error Handling**: Ensure graceful degradation

### 7.2 Context-Engineering Validation
- **First-Principles**: Does each component serve core needs?
- **Systematic Organization**: Is the code structure logical?
- **Optimization**: Are we maximizing context efficiency?

---

## Implementation Timeline

| Phase | Duration | Dependencies | Risk Level |
|-------|----------|--------------|------------|
| Phase 1 | 1-2 days | Environment setup | Low |
| Phase 2 | 2-3 days | Database access | Medium |
| Phase 3 | 3-4 days | Architecture design | Medium |
| Phase 4 | 4-5 days | Realtime expertise | High |
| Phase 5 | 5-7 days | Component knowledge | Medium |
| Phase 6 | 2-3 days | Performance testing | Low |
| Phase 7 | 2-3 days | All phases | Low |

**Total Estimated Time: 19-27 days**

---

## Risk Mitigation

1. **Data Loss**: Comprehensive backups before migration
2. **Downtime**: Plan for zero-downtime migration strategy
3. **Performance**: Monitor and optimize in real-time
4. **Complexity**: Implement incrementally with rollback capability

---

## Success Metrics

- **Performance**: 50% reduction in bandwidth usage
- **User Experience**: Near-instant message delivery
- **Scalability**: Support 10x concurrent users
- **Reliability**: 99.9% uptime for realtime features

---

## Files to Modify

### Core Infrastructure
- `src/db/index.ts` - Database client configuration
- `drizzle.config.ts` - Drizzle configuration
- `.env` - Environment variables
- `src/lib/supabase.ts` - New Supabase client (create)

### Realtime Implementation
- `src/lib/realtime.ts` - Realtime utilities (create)
- `src/context/realtime/RealtimeContext.ts` - Realtime context (create)
- `src/hooks/useRealtime.ts` - Realtime hook (create)
- `src/components/realtime/` - Realtime components (create)

### Component Updates
- `src/app/spaces/[id]/page.tsx` - Replace polling with Realtime
- `src/app/notes/[id]/page.tsx` - Realtime collaboration
- `src/app/lessons/[id]/page.tsx` - Live progress updates
- `src/lib/auth.ts` - Update adapter for PostgreSQL

---

## Next Steps

1. Set up Supabase project and obtain credentials
2. Install required dependencies
3. Begin Phase 1 implementation
4. Test database connection and schema migration
5. Proceed with Realtime implementation

---

## Notes

- This migration maintains compatibility with existing Better Auth setup
- Context-Engineering patterns influence the systematic, first-principles approach
- Realtime implementation prioritizes user experience and performance
- Gradual migration minimizes risk and allows for rollback