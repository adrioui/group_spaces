import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

// Initialize database connection directly to avoid import issues
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function main() {
  console.log('📊 Database Summary:');
  console.log('==================');

  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const spaceCount = await db.select({ count: sql<number>`count(*)` }).from(schema.spaces);
    const messageCount = await db.select({ count: sql<number>`count(*)` }).from(schema.messages);
    const noteCount = await db.select({ count: sql<number>`count(*)` }).from(schema.notes);
    const lessonCount = await db.select({ count: sql<number>`count(*)` }).from(schema.lessons);
    const noteBlockCount = await db.select({ count: sql<number>`count(*)` }).from(schema.noteBlocks);
    const lessonTopicCount = await db.select({ count: sql<number>`count(*)` }).from(schema.lessonTopics);
    const progressCount = await db.select({ count: sql<number>`count(*)` }).from(schema.progress);
    const spaceMemberCount = await db.select({ count: sql<number>`count(*)` }).from(schema.spaceMembers);

    console.log(`Users: ${userCount[0].count}`);
    console.log(`Spaces: ${spaceCount[0].count}`);
    console.log(`Space Members: ${spaceMemberCount[0].count}`);
    console.log(`Messages: ${messageCount[0].count}`);
    console.log(`Notes: ${noteCount[0].count}`);
    console.log(`Note Blocks: ${noteBlockCount[0].count}`);
    console.log(`Lessons: ${lessonCount[0].count}`);
    console.log(`Lesson Topics: ${lessonTopicCount[0].count}`);
    console.log(`Progress Records: ${progressCount[0].count}`);

    console.log('\n👥 Sample Users:');
    const sampleUsers = await db.select().from(schema.users).limit(3);
    sampleUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    console.log('\n🏠 Sample Spaces:');
    const sampleSpaces = await db.select().from(schema.spaces).limit(3);
    sampleSpaces.forEach(space => {
      console.log(`- ${space.name} (Theme: ${space.themeColor})`);
    });

    console.log('\n💬 Recent Messages:');
    const recentMessages = await db.select({
      content: schema.messages.content,
      createdAt: schema.messages.createdAt
    }).from(schema.messages).limit(3);
    recentMessages.forEach(msg => {
      console.log(`- ${msg.content.substring(0, 50)}... (${new Date(msg.createdAt).toLocaleDateString()})`);
    });

    console.log('\n📚 Sample Lessons:');
    const sampleLessons = await db.select().from(schema.lessons).limit(3);
    sampleLessons.forEach(lesson => {
      console.log(`- ${lesson.title} (${lesson.availability})`);
    });

    console.log('\n📋 Sample Notes:');
    const sampleNotes = await db.select().from(schema.notes).limit(3);
    sampleNotes.forEach(note => {
      console.log(`- ${note.title} (${note.status})`);
    });

    console.log('\n✅ Test data verification completed successfully!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Critical error:', error);
  process.exit(1);
});