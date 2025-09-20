# Group Spaces - Project Documentation

## Project Overview

**Group Spaces** is a collaborative learning and work platform built with Next.js, featuring real-time chat, block-based notes, and lesson management. The platform enables users to create spaces for team collaboration, educational content delivery, and community engagement.

## Tech Stack

### Core Technologies
- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Turso (SQLite) with Drizzle ORM → *Migrating to Supabase (PostgreSQL)*
- **Authentication**: Better Auth
- **UI Framework**: Shadcn/ui with Tailwind CSS
- **Realtime**: Currently polling-based → *Migrating to Supabase Realtime*

### Key Dependencies
- `@supabase/supabase-js` - Realtime database (target)
- `drizzle-orm` - Database ORM
- `better-auth` - Authentication
- `@radix-ui/*` - UI primitives
- `tailwindcss` - Styling

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── spaces/            # Space management
│   ├── notes/             # Block-based notes
│   ├── lessons/           # Lesson pages
│   └── (auth pages)       # Sign-in/Sign-up
├── components/            # UI components
│   └── ui/               # Shadcn/ui components
├── db/                   # Database schema and utilities
├── lib/                  # Utilities and configurations
└── hooks/                # Custom React hooks
```

## Database Schema

### Core Tables
- **users** - User profiles and authentication
- **spaces** - Collaborative workspaces
- **space_members** - Membership with roles (owner/admin/member)
- **messages** - Real-time chat messages
- **notes** - Collaborative notes with assignments
- **note_blocks** - Block-based content (text/todo/link)
- **lessons** - Educational content structure
- **lesson_topics** - Individual lesson components
- **progress** - User learning progress
- **notifications** - System notifications

## Key Features

### 1. Space Management
- Create and manage collaborative spaces
- Role-based permissions (owner, admin, member)
- Space customization (wallpaper, theme)
- Member invitation system

### 2. Real-time Communication
- Group chat with message persistence
- Image attachments support
- Currently using 5-second polling → *Migrating to WebSockets*

### 3. Block-based Notes
- Create notes with three block types:
  - **Text**: Markdown-like content
  - **Todo**: Task lists with completion status
  - **Link**: External references
- Real-time collaboration capabilities
- Publishing workflow with notifications

### 4. Learning Management
- Create courses with multiple topics
- YouTube video integration
- External link support
- Progress tracking and completion
- Availability gating (Always/After previous/Custom dates)

### 5. User Management
- Authentication and authorization
- Profile customization
- Progress tracking across spaces

## Current Architecture

### Authentication Flow
1. User authentication via Better Auth
2. Session management with JWT tokens
3. User synchronization with local database
4. Permission-based access control

### Real-time Implementation
- Current: Polling-based updates (5-second intervals)
- Target: Supabase Realtime with WebSocket connections
- Event-driven architecture for chat, notifications, and live updates

## API Structure

### Authentication
- `/api/auth/*` - Better Auth endpoints
- Session management and user operations

### Core Resources
- `/api/spaces` - Space CRUD operations
- `/api/messages` - Chat message management
- `/api/notes` - Note creation and management
- `/api/lessons` - Course and topic management
- `/api/progress` - User progress tracking
- `/api/notifications` - System notifications

## Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack

# Production
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
```

## Environment Variables

### Required Variables
```env
# Database (Current - Turso)
TURSO_CONNECTION_URL=
TURSO_AUTH_TOKEN=

# Authentication
BETTER_AUTH_SECRET=

# Target (Supabase)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Migration Status

### Current State
- ✅ Basic space management
- ✅ Block-based note system
- ✅ Chat functionality (polling-based)
- ✅ User authentication
- ✅ Progress tracking
- ⚠️ Real-time features (polling only)
- ❌ Advanced notifications
- ❌ Lesson gating logic

### Roadmap
See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for detailed migration strategy to Supabase Realtime.

## PRD Alignment

This project implements the "Spaces & Group Chat with Block Notes & Lesson Pages" PRD with the following progress:

- **Core Features**: 70% complete
- **Real-time Infrastructure**: 40% complete (in progress)
- **User Experience**: 60% complete
- **Advanced Features**: 30% complete

Key missing features from PRD:
- Space wallpaper customization
- Profile picture editor (emoji/camera/gallery)
- Lesson availability gating
- Enhanced notification system
- Three-column layout

## Development Notes

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Tailwind CSS for styling
- Component composition patterns

### Testing
- Manual testing currently implemented
- Integration tests needed for database operations
- E2E testing recommended for user flows

### Performance Considerations
- Database query optimization needed
- Real-time migration will improve performance
- Image upload optimization required
- Bundle size analysis recommended

## Contributing

1. Follow the established TypeScript patterns
2. Use the existing UI component library
3. Maintain separation between UI and business logic
4. Test database changes thoroughly
5. Document new features and API changes

## Deployment

### Current Setup
- Next.js application with static export support
- Turso database for persistence
- Better Auth for authentication

### Target Deployment
- Supabase for database and real-time
- Vercel or similar for Next.js hosting
- Object storage for file uploads

## Support

For questions or issues:
1. Review existing documentation
2. Check migration plan for database changes
3. Consult PRD for feature requirements
4. Test changes in development environment

---

*Last Updated: September 2025*
*Version: 1.0.0*