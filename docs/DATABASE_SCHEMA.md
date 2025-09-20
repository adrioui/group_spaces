# Group Spaces - Database Schema Documentation

## Overview

The Group Spaces application uses a well-structured SQLite database with 11 core tables that support collaborative workspaces, real-time communication, block-based notes, learning management, and notification systems. This document provides a comprehensive overview of the database architecture, relationships, and design decisions.

## Database Schema

### Core Schema Diagram

```
users (1) ----< space_members (M) >---- (1) spaces (1) ----< lessons (M)
    |                    |                        |
    |                    |                        |
    |                    |                        |
    |                    v                        v
    |             messages (M)               lesson_topics (M)
    |                    |                        |
    |                    |                        |
    |                    v                        v
    |                notes (1) ------< note_blocks (M) >---- progress (M)
    |                    |                        |
    |                    |                        |
    |                    v                        v
    |             notifications (M) --------------
    |
    |
    └------------------ progress (M)
```

## Table Definitions

### 1. Users Table

**Purpose**: Store user profiles and authentication information

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_provider_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **auth_provider_id**: External authentication provider ID (e.g., Google, GitHub)
- **email**: User's email address (unique, required)
- **name**: User's display name (required)
- **avatar_url**: URL to user's profile picture
- **bio**: User biography or description
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `UNIQUE (auth_provider_id)`
- `UNIQUE (email)`

### 2. Spaces Table

**Purpose**: Store collaborative workspace information

```sql
CREATE TABLE spaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  theme_color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **owner_id**: Foreign key to users table (space creator)
- **name**: Space display name (required)
- **slug**: URL-friendly space identifier (unique, required)
- **description**: Space description or purpose
- **cover_image_url**: URL to space cover image
- **theme_color**: Custom theme color for UI customization
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `UNIQUE (slug)`
- `INDEX (owner_id)`

### 3. Space Members Table

**Purpose**: Manage space membership and permissions

```sql
CREATE TABLE space_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **space_id**: Foreign key to spaces table
- **user_id**: Foreign key to users table
- **role**: User role in space ('owner', 'admin', 'member')
- **status**: Membership status ('active', 'invited', 'left')
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `UNIQUE (space_id, user_id)`
- `INDEX (user_id)`
- `INDEX (status)`

#### Role Definitions
- **owner**: Full control over space management
- **admin**: Can manage members and content
- **member**: Can participate in space activities

#### Status Definitions
- **active**: User is an active member
- **invited**: User has been invited but not yet accepted
- **left**: User has left the space

### 4. Messages Table

**Purpose**: Store real-time chat messages

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **space_id**: Foreign key to spaces table
- **user_id**: Foreign key to users table (message author)
- **content**: Message text content (required)
- **attachments**: JSON array of file attachments
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `INDEX (space_id)`
- `INDEX (user_id)`
- `INDEX (created_at)`

#### Attachments Format
```json
[
  {
    "id": "unique-file-id",
    "name": "document.pdf",
    "size": 1024,
    "type": "application/pdf",
    "url": "https://example.com/files/document.pdf"
  }
]
```

### 5. Notes Table

**Purpose**: Store collaborative notes with assignments and due dates

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to INTEGER,
  due_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id),
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **space_id**: Foreign key to spaces table
- **author_id**: Foreign key to users table (note creator)
- **title**: Note title (required)
- **status**: Note status ('draft', 'published')
- **assigned_to**: Foreign key to users table (assigned user)
- **due_at**: Due date for note completion
- **published_at**: Timestamp when note was published
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `INDEX (space_id)`
- `INDEX (author_id)`
- `INDEX (assigned_to)`
- `INDEX (status)`
- `INDEX (due_at)`

### 6. Note Blocks Table

**Purpose**: Store block-based content for notes

```sql
CREATE TABLE note_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **note_id**: Foreign key to notes table
- **type**: Block type ('text', 'todo', 'link')
- **content**: JSON content specific to block type
- **position**: Block ordering position (required)
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `INDEX (note_id)`
- `INDEX (type)`
- `INDEX (position)`

#### Block Content Formats

**Text Block:**
```json
{
  "text": "# Heading\n\nThis is **bold** text with *italic* formatting."
}
```

**Todo Block:**
```json
{
  "text": "Complete the project documentation",
  "completed": false
}
```

**Link Block:**
```json
{
  "url": "https://github.com/user/repo",
  "title": "GitHub Repository"
}
```

### 7. Lessons Table

**Purpose**: Store educational course information

```sql
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  availability TEXT NOT NULL,
  available_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **space_id**: Foreign key to spaces table
- **title**: Course title (required)
- **description**: Course description
- **cover_image_url**: URL to course cover image
- **availability**: Availability type ('always', 'date', 'prerequisite')
- **available_at**: Date when course becomes available
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `INDEX (space_id)`
- `INDEX (availability)`
- `INDEX (available_at)`

#### Availability Types
- **always**: Course is immediately available
- **date**: Course becomes available on specific date
- **prerequisite**: Course available after completing previous course

### 8. Lesson Topics Table

**Purpose**: Store individual topics within lessons

```sql
CREATE TABLE lesson_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  youtube_url TEXT,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **lesson_id**: Foreign key to lessons table
- **title**: Topic title (required)
- **body**: Topic content (required)
- **youtube_url**: YouTube video URL for multimedia content
- **position**: Topic ordering position (required)
- **created_at**: Timestamp of record creation
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `INDEX (lesson_id)`
- `INDEX (position)`

### 9. Progress Table

**Purpose**: Track user progress through lessons and topics

```sql
CREATE TABLE progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  topic_id INTEGER,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  FOREIGN KEY (topic_id) REFERENCES lesson_topics(id)
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **lesson_id**: Foreign key to lessons table
- **topic_id**: Foreign key to lesson_topics table (nullable)
- **status**: Progress status ('not_started', 'in_progress', 'completed')
- **updated_at**: Timestamp of last update

#### Indexes
- `PRIMARY KEY (id)`
- `UNIQUE (user_id, lesson_id, topic_id)`
- `INDEX (user_id)`
- `INDEX (lesson_id)`
- `INDEX (topic_id)`
- `INDEX (status)`

#### Status Definitions
- **not_started**: User has not begun the lesson/topic
- **in_progress**: User is currently working on the lesson/topic
- **completed**: User has finished the lesson/topic

### 10. Notifications Table

**Purpose**: Store user notifications and alerts

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **type**: Notification type identifier
- **payload**: JSON payload with notification data
- **read**: Boolean flag indicating if notification has been read
- **created_at**: Timestamp of record creation

#### Indexes
- `PRIMARY KEY (id)`
- `INDEX (user_id)`
- `INDEX (type)`
- `INDEX (read)`
- `INDEX (created_at)`

#### Notification Types and Payloads

**Note Published:**
```json
{
  "type": "note_published",
  "payload": {
    "noteId": 1,
    "title": "Project Roadmap",
    "spaceName": "Web Development Team"
  }
}
```

**Space Invitation:**
```json
{
  "type": "space_invite",
  "payload": {
    "spaceId": 2,
    "spaceName": "Design Team",
    "inviterName": "John Doe"
  }
}
```

**Mention in Message:**
```json
{
  "type": "message_mention",
  "payload": {
    "messageId": 42,
    "spaceId": 1,
    "authorName": "Jane Smith",
    "messagePreview": "Hey @john, can you review this?"
  }
}
```

## Database Relationships

### One-to-Many Relationships

#### Users to Spaces
- **Relationship**: One user can own multiple spaces
- **Implementation**: `spaces.owner_id` references `users.id`

#### Users to Space Members
- **Relationship**: One user can be member of multiple spaces
- **Implementation**: `space_members.user_id` references `users.id`

#### Spaces to Space Members
- **Relationship**: One space can have multiple members
- **Implementation**: `space_members.space_id` references `spaces.id`

#### Spaces to Messages
- **Relationship**: One space can have multiple messages
- **Implementation**: `messages.space_id` references `spaces.id`

#### Spaces to Notes
- **Relationship**: One space can have multiple notes
- **Implementation**: `notes.space_id` references `spaces.id`

#### Spaces to Lessons
- **Relationship**: One space can have multiple lessons
- **Implementation**: `lessons.space_id` references `spaces.id`

#### Notes to Note Blocks
- **Relationship**: One note can have multiple blocks
- **Implementation**: `note_blocks.note_id` references `notes.id`

#### Lessons to Lesson Topics
- **Relationship**: One lesson can have multiple topics
- **Implementation**: `lesson_topics.lesson_id` references `lessons.id`

### Many-to-Many Relationships

#### Users to Spaces (through Space Members)
- **Relationship**: Users can belong to multiple spaces, spaces can have multiple users
- **Implementation**: Junction table `space_members`

#### Users to Progress
- **Relationship**: Users can have progress records for multiple lessons/topics
- **Implementation**: `progress.user_id` references `users.id`

#### Users to Notifications
- **Relationship**: Users can receive multiple notifications
- **Implementation**: `notifications.user_id` references `users.id`

### Self-Referencing Relationships

#### Users to Assigned Notes
- **Relationship**: Users can be assigned to notes created by other users
- **Implementation**: `notes.assigned_to` references `users.id`

## Database Design Principles

### Normalization
- **First Normal Form (1NF)**: All tables have atomic values and unique rows
- **Second Normal Form (2NF)**: All non-key attributes are fully dependent on primary keys
- **Third Normal Form (3NF)**: No transitive dependencies between non-key attributes

### Indexing Strategy
- **Primary Keys**: All tables have auto-incrementing integer primary keys
- **Foreign Keys**: All foreign key columns are indexed for better join performance
- **Query Optimization**: Indexes on frequently queried columns (status, dates, etc.)
- **Unique Constraints**: Unique indexes on natural keys (email, slug, etc.)

### Data Integrity
- **Foreign Key Constraints**: All relationships have proper foreign key constraints
- **NOT NULL Constraints**: Required fields are properly constrained
- **Unique Constraints**: Business rules enforced through unique constraints
- **Check Constraints**: Enum-like values validated through application logic

### Performance Considerations
- **Query Optimization**: Selective indexing to balance read/write performance
- **Connection Pooling**: Managed by database connection layer
- **Caching Strategy**: Application-level caching for frequently accessed data
- **Batch Operations**: Support for bulk operations where appropriate

## Migration Strategy

### Schema Evolution
- **Additive Changes**: New tables and columns added without breaking existing functionality
- **Backward Compatibility**: Existing queries continue to work after schema changes
- **Data Migration**: Scripts to migrate existing data when schema changes
- **Rollback Procedures**: Ability to rollback changes if issues arise

### Database Versioning
- **Migration Files**: Version-controlled migration scripts
- **Change Log**: Comprehensive documentation of all schema changes
- **Testing**: All migrations tested in development environment
- **Deployment**: Automated migration deployment with rollback capability

## Security Considerations

### Data Protection
- **Input Validation**: All inputs validated before database operations
- **SQL Injection Prevention**: Parameterized queries through ORM
- **Sensitive Data**: No sensitive data stored in plain text
- **Access Control**: Database-level access controls implemented

### Privacy Considerations
- **User Data**: Personal information properly secured
- **Content Ownership**: Clear ownership model for user-generated content
- **Data Retention**: Policies for data retention and deletion
- **Compliance**: Considerations for data protection regulations

## Monitoring and Maintenance

### Performance Monitoring
- **Query Performance**: Regular monitoring of slow queries
- **Index Usage**: Tracking index effectiveness and usage
- **Database Size**: Monitoring database growth and optimizing accordingly
- **Connection Pool**: Monitoring connection pool health

### Backup and Recovery
- **Regular Backups**: Automated backup procedures
- **Recovery Testing**: Regular testing of backup restoration
- **Disaster Recovery**: Procedures for database recovery scenarios
- **Data Integrity**: Regular checks for data consistency

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Database Type**: SQLite with Drizzle ORM