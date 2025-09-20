import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Users table - app profile
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authProviderId: text('auth_provider_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Spaces table
export const spaces = sqliteTable('spaces', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  themeColor: text('theme_color'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Space members table
export const spaceMembers = sqliteTable('space_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull(), // 'owner' | 'admin' | 'member'
  status: text('status').notNull(), // 'active' | 'invited' | 'left'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Messages table - real-time chat
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  userId: integer('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  attachments: text('attachments', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Notes table
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  status: text('status').notNull(), // 'draft' | 'published'
  assignedTo: integer('assigned_to').references(() => users.id),
  dueAt: text('due_at'),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Note blocks table - block-based editor
export const noteBlocks = sqliteTable('note_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  noteId: integer('note_id').notNull().references(() => notes.id),
  type: text('type').notNull(), // 'text' | 'todo' | 'link'
  content: text('content', { mode: 'json' }).notNull(),
  position: integer('position').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Lessons table
export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  title: text('title').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  availability: text('availability').notNull(), // 'always' | 'date' | 'prereq'
  availableAt: text('available_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Lesson topics table
export const lessonTopics = sqliteTable('lesson_topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  youtubeUrl: text('youtube_url'),
  position: integer('position').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Progress table
export const progress = sqliteTable('progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  topicId: integer('topic_id').references(() => lessonTopics.id),
  status: text('status').notNull(), // 'not_started' | 'in_progress' | 'completed'
  updatedAt: text('updated_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});
