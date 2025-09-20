# Group Spaces - API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Group Spaces application. The API follows RESTful conventions and uses JSON for request/response formats.

## Authentication

All API endpoints require authentication using Bearer tokens. The authentication header must be included in all requests:

```http
Authorization: Bearer <token>
x-user-id: <user_id>
```

### Authentication Flow

#### Sign In
```http
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Sign Up
```http
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Get Session
```http
GET /api/auth/get-session
Authorization: Bearer <token>
```

## API Endpoints

### 1. Users API

#### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "createdAt": "2025-09-20T18:00:00.000Z",
    "updatedAt": "2025-09-20T18:00:00.000Z"
  }
]
```

#### Create User
```http
POST /api/users
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "email": "jane@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Designer"
}
```

**Response:**
```json
{
  "id": 2,
  "email": "jane@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Designer",
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

### 2. Spaces API

#### List User Spaces
```http
GET /api/spaces?userId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "ownerId": 1,
    "name": "Web Development Team",
    "slug": "web-development-team",
    "description": "Team for web development projects",
    "coverImageUrl": "https://example.com/cover.jpg",
    "themeColor": "#3b82f6",
    "createdAt": "2025-09-20T18:00:00.000Z",
    "updatedAt": "2025-09-20T18:00:00.000Z"
  }
]
```

#### Create Space
```http
POST /api/spaces
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "name": "Design Team",
  "slug": "design-team",
  "description": "Creative design projects",
  "coverImageUrl": "https://example.com/cover.jpg",
  "themeColor": "#8b5cf6"
}
```

**Response:**
```json
{
  "id": 2,
  "ownerId": 1,
  "name": "Design Team",
  "slug": "design-team",
  "description": "Creative design projects",
  "coverImageUrl": "https://example.com/cover.jpg",
  "themeColor": "#8b5cf6",
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

#### Get Space Details
```http
GET /api/spaces/1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
{
  "id": 1,
  "ownerId": 1,
  "name": "Web Development Team",
  "slug": "web-development-team",
  "description": "Team for web development projects",
  "coverImageUrl": "https://example.com/cover.jpg",
  "themeColor": "#3b82f6",
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

#### Update Space
```http
PUT /api/spaces/1
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "name": "Updated Web Team",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": 1,
  "ownerId": 1,
  "name": "Updated Web Team",
  "slug": "web-development-team",
  "description": "Updated description",
  "coverImageUrl": "https://example.com/cover.jpg",
  "themeColor": "#3b82f6",
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

### 3. Space Members API

#### List Space Members
```http
GET /api/space-members?spaceId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "spaceId": 1,
    "userId": 1,
    "role": "owner",
    "status": "active",
    "createdAt": "2025-09-20T18:00:00.000Z",
    "updatedAt": "2025-09-20T18:00:00.000Z"
  },
  {
    "id": 2,
    "spaceId": 1,
    "userId": 2,
    "role": "member",
    "status": "active",
    "createdAt": "2025-09-20T18:00:00.000Z",
    "updatedAt": "2025-09-20T18:00:00.000Z"
  }
]
```

#### Add Space Member
```http
POST /api/space-members
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "spaceId": 1,
  "userId": 3,
  "role": "member"
}
```

**Response:**
```json
{
  "id": 3,
  "spaceId": 1,
  "userId": 3,
  "role": "member",
  "status": "active",
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

#### Update Space Member
```http
PUT /api/space-members/2
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "role": "admin"
}
```

**Response:**
```json
{
  "id": 2,
  "spaceId": 1,
  "userId": 2,
  "role": "admin",
  "status": "active",
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

### 4. Messages API (Real-time Chat)

#### Get Messages
```http
GET /api/messages?spaceId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "spaceId": 1,
    "userId": 1,
    "content": "Hello everyone!",
    "attachments": null,
    "createdAt": "2025-09-20T18:00:00.000Z",
    "updatedAt": "2025-09-20T18:00:00.000Z"
  },
  {
    "id": 2,
    "spaceId": 1,
    "userId": 2,
    "content": "Hi there! How's the project going?",
    "attachments": null,
    "createdAt": "2025-09-20T18:00:00.000Z",
    "updatedAt": "2025-09-20T18:00:00.000Z"
  }
]
```

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "spaceId": 1,
  "content": "Great progress on the new features!"
}
```

**Response:**
```json
{
  "id": 3,
  "spaceId": 1,
  "userId": 1,
  "content": "Great progress on the new features!",
  "attachments": null,
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

### 5. Notes API

#### List Notes
```http
GET /api/notes?spaceId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "spaceId": 1,
    "authorId": 1,
    "title": "Project Roadmap",
    "status": "published",
    "assignedTo": 1,
    "dueAt": "2025-09-28T05:35:01.862Z",
    "publishedAt": "2025-09-20T18:08:34.896Z",
    "createdAt": "2025-09-16T19:41:56.688Z",
    "updatedAt": "2025-09-20T18:08:34.896Z"
  }
]
```

#### Create Note
```http
POST /api/notes
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "spaceId": 1,
  "title": "Meeting Notes",
  "assignedTo": 2,
  "dueAt": "2025-09-25T18:00:00.000Z"
}
```

**Response:**
```json
{
  "id": 2,
  "spaceId": 1,
  "authorId": 1,
  "title": "Meeting Notes",
  "status": "draft",
  "assignedTo": 2,
  "dueAt": "2025-09-25T18:00:00.000Z",
  "publishedAt": null,
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

#### Get Note Details
```http
GET /api/notes?id=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
{
  "id": 1,
  "spaceId": 1,
  "authorId": 1,
  "title": "Project Roadmap",
  "status": "published",
  "assignedTo": 1,
  "dueAt": "2025-09-28T05:35:01.862Z",
  "publishedAt": "2025-09-20T18:08:34.896Z",
  "createdAt": "2025-09-16T19:41:56.688Z",
  "updatedAt": "2025-09-20T18:08:34.896Z"
}
```

#### Update Note
```http
PUT /api/notes?id=1
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "status": "published"
}
```

**Response:**
```json
{
  "id": 1,
  "spaceId": 1,
  "authorId": 1,
  "title": "Project Roadmap",
  "status": "published",
  "assignedTo": 1,
  "dueAt": "2025-09-28T05:35:01.862Z",
  "publishedAt": "2025-09-20T18:08:34.896Z",
  "createdAt": "2025-09-16T19:41:56.688Z",
  "updatedAt": "2025-09-20T18:08:34.896Z"
}
```

### 6. Note Blocks API

#### Get Note Blocks
```http
GET /api/note-blocks?noteId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "noteId": 1,
    "type": "text",
    "content": "{\"text\":\"# Project Overview\\n\\nThis document outlines our approach to the current project.\"}",
    "position": 1,
    "createdAt": "2025-09-20T17:48:10.214Z",
    "updatedAt": "2025-09-20T18:02:42.328Z"
  },
  {
    "id": 2,
    "noteId": 1,
    "type": "todo",
    "content": "{\"text\":\"Complete initial database schema design\",\"completed\":false}",
    "position": 2,
    "createdAt": "2025-09-20T06:01:22.385Z",
    "updatedAt": "2025-09-20T18:02:42.328Z"
  }
]
```

#### Create Note Block
```http
POST /api/note-blocks
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "noteId": 1,
  "type": "text",
  "content": {
    "text": "Welcome to our collaborative space!"
  },
  "position": 3
}
```

**Response:**
```json
{
  "id": 122,
  "noteId": 1,
  "type": "text",
  "content": "{\"text\":\"Welcome to our collaborative space!\"}",
  "position": 3,
  "createdAt": "2025-09-20T18:07:03.450Z",
  "updatedAt": "2025-09-20T18:07:03.450Z"
}
```

#### Update Note Block
```http
PUT /api/note-blocks?id=123
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "content": {
    "text": "Review project requirements",
    "completed": true
  }
}
```

**Response:**
```json
{
  "id": 123,
  "noteId": 1,
  "type": "todo",
  "content": "{\"text\":\"Review project requirements\",\"completed\":true}",
  "position": 2,
  "createdAt": "2025-09-20T18:07:18.794Z",
  "updatedAt": "2025-09-20T18:08:26.191Z"
}
```

#### Delete Note Block
```http
DELETE /api/note-blocks?id=124
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
{
  "message": "Block deleted",
  "deletedBlockId": 124
}
```

#### Reorder Note Blocks
```http
PUT /api/note-blocks/reorder
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

[
  {
    "id": 1,
    "position": 1
  },
  {
    "id": 2,
    "position": 2
  },
  {
    "id": 3,
    "position": 3
  }
]
```

**Response:**
```json
[
  {
    "id": 1,
    "noteId": 1,
    "type": "text",
    "content": "{\"text\":\"# Project Overview\\n\\nThis document outlines our approach to the current project.\"}",
    "position": 1,
    "createdAt": "2025-09-20T17:48:10.214Z",
    "updatedAt": "2025-09-20T18:09:00.000Z"
  },
  {
    "id": 2,
    "noteId": 1,
    "type": "todo",
    "content": "{\"text\":\"Complete initial database schema design\",\"completed\":false}",
    "position": 2,
    "createdAt": "2025-09-20T06:01:22.385Z",
    "updatedAt": "2025-09-20T18:09:00.000Z"
  },
  {
    "id": 3,
    "noteId": 1,
    "type": "text",
    "content": "{\"text\":\"Welcome to our collaborative space!\"}",
    "position": 3,
    "createdAt": "2025-09-20T18:07:03.450Z",
    "updatedAt": "2025-09-20T18:09:00.000Z"
  }
]
```

### 7. Lessons API

#### List Lessons
```http
GET /api/lessons?spaceId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "spaceId": 1,
    "title": "Introduction to Web Development",
    "description": "A comprehensive course on introduction to web development",
    "coverImageUrl": "https://example.com/cover.jpg",
    "availability": "always",
    "availableAt": null,
    "createdAt": "2025-09-11T18:13:48.605Z",
    "updatedAt": "2025-09-20T18:02:42.597Z"
  },
  {
    "id": 2,
    "spaceId": 1,
    "title": "Advanced Database Design",
    "description": "A comprehensive course on advanced database design",
    "coverImageUrl": "https://example.com/cover.jpg",
    "availability": "date",
    "availableAt": "2025-09-23T21:32:33.856Z",
    "createdAt": "2025-09-13T03:19:32.985Z",
    "updatedAt": "2025-09-20T18:02:42.597Z"
  }
]
```

#### Create Lesson
```http
POST /api/lessons
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "spaceId": 1,
  "title": "New Course",
  "description": "Course description",
  "coverImageUrl": "https://example.com/cover.jpg",
  "availability": "always"
}
```

**Response:**
```json
{
  "id": 3,
  "spaceId": 1,
  "title": "New Course",
  "description": "Course description",
  "coverImageUrl": "https://example.com/cover.jpg",
  "availability": "always",
  "availableAt": null,
  "createdAt": "2025-09-20T18:00:00.000Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

#### Get Lesson Details
```http
GET /api/lessons?id=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
{
  "id": 1,
  "spaceId": 1,
  "title": "Introduction to Web Development",
  "description": "A comprehensive course on introduction to web development",
  "coverImageUrl": "https://example.com/cover.jpg",
  "availability": "always",
  "availableAt": null,
  "createdAt": "2025-09-11T18:13:48.605Z",
  "updatedAt": "2025-09-20T18:02:42.597Z",
  "topics": [
    {
      "id": 1,
      "lessonId": 1,
      "title": "Getting Started",
      "body": "Welcome to this comprehensive course...",
      "youtubeUrl": null,
      "position": 1,
      "createdAt": "2025-09-13T15:35:35.861Z",
      "updatedAt": "2025-09-20T18:02:42.850Z"
    },
    {
      "id": 2,
      "lessonId": 1,
      "title": "Core Concepts",
      "body": "Let's dive deeper into the core concepts...",
      "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "position": 2,
      "createdAt": "2025-09-15T07:17:49.449Z",
      "updatedAt": "2025-09-20T18:02:42.850Z"
    }
  ]
}
```

#### Update Lesson
```http
PUT /api/lessons?id=1
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "title": "Updated Course Title",
  "availability": "date",
  "availableAt": "2025-09-25T18:00:00.000Z"
}
```

**Response:**
```json
{
  "id": 1,
  "spaceId": 1,
  "title": "Updated Course Title",
  "description": "A comprehensive course on introduction to web development",
  "coverImageUrl": "https://example.com/cover.jpg",
  "availability": "date",
  "availableAt": "2025-09-25T18:00:00.000Z",
  "createdAt": "2025-09-11T18:13:48.605Z",
  "updatedAt": "2025-09-20T18:00:00.000Z"
}
```

### 8. Progress API

#### Get Progress
```http
GET /api/progress?lessonId=1
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "lessonId": 1,
    "topicId": null,
    "status": "in_progress",
    "updatedAt": "2025-09-19T18:22:37.778Z"
  },
  {
    "id": 2,
    "userId": 1,
    "lessonId": 1,
    "topicId": 1,
    "status": "completed",
    "updatedAt": "2025-09-20T18:10:53.646Z"
  }
]
```

#### Update Progress
```http
POST /api/progress
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "lessonId": 1,
  "topicId": 2,
  "status": "completed"
}
```

**Response:**
```json
{
  "id": 3,
  "userId": 1,
  "lessonId": 1,
  "topicId": 2,
  "status": "completed",
  "updatedAt": "2025-09-20T18:10:53.646Z"
}
```

### 9. Notifications API

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "type": "note_published",
    "payload": "{\"noteId\":1,\"title\":\"Project Roadmap\",\"spaceName\":\"Web Development Team\"}",
    "read": false,
    "createdAt": "2025-09-20T18:11:43.602Z"
  },
  {
    "id": 2,
    "userId": 1,
    "type": "space_invite",
    "payload": "{\"spaceId\":2,\"spaceName\":\"Design Team\",\"inviterName\":\"John Doe\"}",
    "read": true,
    "createdAt": "2025-09-20T18:11:43.602Z"
  }
]
```

#### Create Notification
```http
POST /api/notifications
Authorization: Bearer <token>
x-user-id: 1
Content-Type: application/json

{
  "type": "note_published",
  "payload": {
    "noteId": 1,
    "title": "Project Roadmap",
    "spaceName": "Web Development Team"
  }
}
```

**Response:**
```json
{
  "id": 3,
  "userId": 1,
  "type": "note_published",
  "payload": "{\"noteId\":1,\"title\":\"Project Roadmap\",\"spaceName\":\"Web Development Team\"}",
  "read": false,
  "createdAt": "2025-09-20T18:11:43.602Z"
}
```

#### Mark Notification as Read
```http
PUT /api/notifications?id=3&read=true
Authorization: Bearer <token>
x-user-id: 1
```

**Response:**
```json
{
  "id": 3,
  "userId": 1,
  "type": "note_published",
  "payload": "{\"noteId\":1,\"title\":\"Project Roadmap\",\"spaceName\":\"Web Development Team\"}",
  "read": true,
  "createdAt": "2025-09-20T18:11:43.602Z"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### Common Error Codes

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| 400 | Bad Request | `{"error": "Missing required fields", "code": "MISSING_FIELDS"}` |
| 401 | Unauthorized | `{"error": "Authentication required"}` |
| 403 | Forbidden | `{"error": "Access denied", "code": "ACCESS_DENIED"}` |
| 404 | Not Found | `{"error": "Resource not found"}` |
| 500 | Internal Server Error | `{"error": "Internal server error: [details]"}` |

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional error information (optional)"
}
```

## Rate Limiting

Current implementation does not include rate limiting, but it's recommended for production deployment:

- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per minute
- **File uploads**: 10 requests per minute

## Security Considerations

### Input Validation
- All inputs are validated using Zod schemas
- SQL injection prevention through parameterized queries
- XSS prevention through React's built-in escaping

### Authentication
- Bearer token authentication for all protected endpoints
- Session management with secure cookies
- CSRF protection through Better Auth

### Access Control
- Space membership verification for all operations
- Role-based permissions for sensitive operations
- User ID validation for all user-specific operations

## Real-time Features

### Current Implementation
- **Polling**: 5-second intervals for real-time updates
- **Endpoints**: Messages, notifications, and progress updates

### Future Enhancement
- **WebSockets**: Planned upgrade for true real-time communication
- **Server-sent Events**: Alternative for lightweight real-time updates

## Testing

### API Testing
All endpoints have been tested using curl commands. Example test cases:

```bash
# Test space creation
curl -X POST "http://localhost:3000/api/spaces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -H "x-user-id: 1" \
  -d '{"name":"Test Space","slug":"test-space"}'

# Test message sending
curl -X POST "http://localhost:3000/api/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -H "x-user-id: 1" \
  -d '{"spaceId":1,"content":"Test message"}'
```

### Test Coverage
- ✅ All endpoints tested with valid inputs
- ✅ Error handling tested with invalid inputs
- ✅ Authentication tested with valid/invalid tokens
- ✅ Authorization tested with proper/improper access

---

**Last Updated**: September 2025
**Version**: 1.0.0
**API Version**: v1