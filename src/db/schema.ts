import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Better Auth required tables - MUST match Better Auth's expected schema
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  phone: text('phone').unique(),
  phoneNumber: text('phone_number').unique(), // Separate column for Better Auth
  phoneVerified: boolean('phone_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export as users for compatibility with other files
export const users = user;

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Your application tables - using the correct user reference
export const spaces = pgTable('spaces', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => user.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  themeColor: text('theme_color'),
  wallpaper: text('wallpaper').default('neutral'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const spaceMembers = pgTable('space_members', {
  id: serial('id').primaryKey(),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  userId: text('user_id').notNull().references(() => user.id),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('active'),
  notificationMode: text('notification_mode').notNull().default('every_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  userId: text('user_id').notNull().references(() => user.id),
  content: text('content').notNull(),
  attachments: jsonb('attachments'),
  messageType: text('message_type').notNull().default('message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  authorId: text('author_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  assignedTo: text('assigned_to').references(() => user.id),
  dueAt: timestamp('due_at'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const noteBlocks = pgTable('note_blocks', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id').notNull().references(() => notes.id),
  type: text('type').notNull(),
  content: jsonb('content').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  spaceId: integer('space_id').notNull().references(() => spaces.id),
  authorId: text('author_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  availability: text('availability').notNull().default('always'),
  availableAt: timestamp('available_at'),
  status: text('status').notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonTopics = pgTable('lesson_topics', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  title: text('title').notNull(),
  body: text('body'),
  contentType: text('content_type').notNull().default('youtube'),
  contentUrl: text('content_url'),
  availability: text('availability').notNull().default('always'),
  availableAt: timestamp('available_at'),
  position: integer('position').notNull(),
  status: text('status').notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  lessonId: integer('lesson_id').references(() => lessons.id),
  topicId: integer('topic_id').references(() => lessonTopics.id),
  status: text('status').notNull().default('not_started'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  spaceId: integer('space_id').references(() => spaces.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  payload: jsonb('payload'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

