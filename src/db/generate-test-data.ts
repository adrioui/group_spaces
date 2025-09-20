import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Initialize database connection directly to avoid import issues
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });
import {
  users,
  spaces,
  spaceMembers,
  messages,
  notes,
  noteBlocks,
  lessons,
  lessonTopics,
  progress
} from '@/db/schema';

// Test data generators
const generateTestUser = (index: number) => ({
  authProviderId: `auth_test_${index}_${Date.now()}`,
  email: `testuser${index}@example.com`,
  name: `Test User ${index}`,
  avatarUrl: `https://ui-avatars.com/api/?name=Test+User+${index}&background=${index % 2 === 0 ? '4CAF50' : '2196F3'}&color=fff&size=200`,
  bio: `Test user ${index} - passionate about collaborative learning and development`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const generateTestSpace = (ownerId: number, index: number) => {
  const spaceNames = [
    'Web Development Team',
    'Design Innovation Hub',
    'Data Science Collective',
    'Mobile App Development',
    'AI/ML Research Group',
    'DevOps Excellence',
    'Product Management',
    'UX Research Lab'
  ];

  const themes = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

  return {
    ownerId,
    name: spaceNames[index % spaceNames.length],
    slug: `test-space-${ownerId}-${index}`,
    description: `A collaborative space for ${spaceNames[index % spaceNames.length].toLowerCase()} professionals to share knowledge and work together on innovative projects.`,
    coverImageUrl: `https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop&sig=${index}`,
    themeColor: themes[index % themes.length],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const generateTestMessage = (spaceId: number, userId: number, index: number) => {
  const messages = [
    "Hey everyone! Just finished setting up our new collaboration tools. Looking forward to working together!",
    "I've been reviewing the project requirements and have some ideas for improving our workflow.",
    "Quick update: The database migration is complete and all systems are running smoothly.",
    "Great work on the latest features! The user feedback has been overwhelmingly positive.",
    "I found this really interesting article about agile methodologies that I think could benefit our team.",
    "Let's schedule a standup meeting tomorrow to discuss our progress and blockers.",
    "The code review went well - just a few minor suggestions before we can merge to main.",
    "I'm working on the API documentation and should have it ready for review by end of week.",
    "Has anyone had experience with the new testing framework? I'd love to hear your thoughts.",
    "Excellent progress everyone! We're ahead of schedule for this sprint. 🚀"
  ];

  const attachmentTypes = ['image', 'file', null];
  const attachmentType = attachmentTypes[index % attachmentTypes.length];

  let attachments = null;
  if (attachmentType) {
    attachments = JSON.stringify([{
      type: attachmentType,
      name: `test-${attachmentType}-${index}.${attachmentType === 'image' ? 'png' : 'pdf'}`,
      url: `https://example.com/uploads/test-${attachmentType}-${index}.${attachmentType === 'image' ? 'png' : 'pdf'}`,
      size: Math.floor(Math.random() * 1000000) + 50000
    }]);
  }

  return {
    spaceId,
    userId,
    content: messages[index % messages.length],
    attachments,
    createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const generateTestNote = (spaceId: number, authorId: number, index: number) => {
  const noteTitles = [
    'Project Roadmap',
    'Technical Architecture',
    'Design System Guidelines',
    'Meeting Notes',
    'Code Review Checklist',
    'Feature Requirements',
    'Bug Tracking',
    'Performance Optimization'
  ];

  const statuses = ['draft', 'published'];
  const status = statuses[index % statuses.length];

  const dueDate = Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null;
  const publishedAt = status === 'published' ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : null;
  const assignedTo = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : null;

  return {
    spaceId,
    authorId,
    title: noteTitles[index % noteTitles.length],
    status,
    assignedTo,
    dueAt: dueDate,
    publishedAt,
    createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const generateTestNoteBlock = (noteId: number, index: number) => {
  const blockTypes = ['text', 'todo', 'link'];
  const type = blockTypes[index % blockTypes.length];

  let content = {};
  switch (type) {
    case 'text':
      content = {
        text: index === 0 ? "# Project Overview\n\nThis document outlines our approach to the current project." :
                index === 1 ? "## Technical Considerations\n\nWe need to focus on scalability and performance." :
                "### Next Steps\n\nLet's review the architecture and decide on the best approach."
      };
      break;
    case 'todo':
      content = {
        text: index === 0 ? "Set up development environment" :
                index === 1 ? "Complete initial database schema design" :
                "Review API documentation",
        completed: index % 3 === 0
      };
      break;
    case 'link':
      content = {
        url: index === 0 ? "https://github.com/project/repo" :
              index === 1 ? "https://figma.com/design/mockups" :
              "https://example.com/documentation",
        title: index === 0 ? "Project Repository" :
                index === 1 ? "Design Mockups" :
                "Documentation"
      };
      break;
  }

  return {
    noteId,
    type,
    content: JSON.stringify(content),
    position: index + 1,
    createdAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const generateTestLesson = (spaceId: number, index: number) => {
  const lessonTitles = [
    'Introduction to Web Development',
    'Advanced Database Design',
    'UI/UX Design Principles',
    'API Development Best Practices',
    'Testing Strategies',
    'DevOps and Deployment',
    'Security Fundamentals',
    'Performance Optimization'
  ];

  const availabilities = ['always', 'date', 'prereq'];
  const availability = availabilities[index % availabilities.length];

  return {
    spaceId,
    title: lessonTitles[index % lessonTitles.length],
    description: `A comprehensive course on ${lessonTitles[index % lessonTitles.length].toLowerCase()} covering fundamental concepts and practical applications.`,
    coverImageUrl: `https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&w=1200&h=600&fit=crop&sig=${index}`,
    availability,
    availableAt: availability === 'date' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
    createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const generateTestLessonTopic = (lessonId: number, index: number) => {
  const topics = [
    {
      title: 'Getting Started',
      body: 'Welcome to this comprehensive course. In this first topic, we\'ll cover the fundamentals and set up your development environment.',
      youtubeUrl: null
    },
    {
      title: 'Core Concepts',
      body: 'Let\'s dive deeper into the core concepts that form the foundation of this subject. We\'ll explore key principles and best practices.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      title: 'Practical Implementation',
      body: 'Now it\'s time to put theory into practice. We\'ll work through real-world examples and hands-on exercises.',
      youtubeUrl: null
    }
  ];

  const topic = topics[index % topics.length];

  return {
    lessonId,
    title: topic.title,
    body: topic.body,
    youtubeUrl: topic.youtubeUrl,
    position: index + 1,
    createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const generateTestProgress = (userId: number, lessonId: number, topicId: number | null) => {
  const statuses = ['not_started', 'in_progress', 'completed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    userId,
    lessonId,
    topicId,
    status,
    updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
  };
};

async function main() {
  console.log('🚀 Starting test data generation...');

  const results = {
    users: 0,
    spaces: 0,
    spaceMembers: 0,
    messages: 0,
    notes: 0,
    noteBlocks: 0,
    lessons: 0,
    lessonTopics: 0,
    progress: 0,
    errors: [] as string[]
  };

  try {
    // Create test users
    console.log('📝 Creating test users...');
    const testUsers = Array.from({ length: 5 }, (_, i) => generateTestUser(i + 1));
    await db.insert(users).values(testUsers);
    results.users = testUsers.length;
    console.log(`✅ Created ${testUsers.length} test users`);

    // Create test spaces
    console.log('🏠 Creating test spaces...');
    const testSpaces = testUsers.flatMap((user, userIndex) =>
      Array.from({ length: 2 }, (_, i) => generateTestSpace(userIndex + 1, i))
    );
    await db.insert(spaces).values(testSpaces);
    results.spaces = testSpaces.length;
    console.log(`✅ Created ${testSpaces.length} test spaces`);

    // Create space members
    console.log('👥 Creating space members...');
    const testSpaceMembers = testSpaces.flatMap((space, spaceIndex) => {
      const members = [];
      const ownerIndex = spaceIndex % testUsers.length;
      const ownerId = ownerIndex + 1;

      // Add owner
      members.push({
        spaceId: spaceIndex + 1,
        userId: ownerId,
        role: 'owner',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add some additional members
      for (let i = 0; i < 2; i++) {
        const memberIndex = (ownerIndex + i + 1) % testUsers.length;
        if (memberIndex !== ownerIndex) {
          members.push({
            spaceId: spaceIndex + 1,
            userId: memberIndex + 1,
            role: i === 0 ? 'admin' : 'member',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      return members;
    });
    await db.insert(spaceMembers).values(testSpaceMembers);
    results.spaceMembers = testSpaceMembers.length;
    console.log(`✅ Created ${testSpaceMembers.length} space member relationships`);

    // Create test messages
    console.log('💬 Creating test messages...');
    const testMessages = testSpaces.flatMap((space, spaceIndex) =>
      Array.from({ length: 8 }, (_, i) =>
        generateTestMessage(spaceIndex + 1, (spaceIndex % testUsers.length) + 1, i)
      )
    );
    await db.insert(messages).values(testMessages);
    results.messages = testMessages.length;
    console.log(`✅ Created ${testMessages.length} test messages`);

    // Create test notes
    console.log('📋 Creating test notes...');
    const testNotes = testSpaces.flatMap((space, spaceIndex) =>
      Array.from({ length: 3 }, (_, i) =>
        generateTestNote(spaceIndex + 1, (spaceIndex % testUsers.length) + 1, i)
      )
    );
    await db.insert(notes).values(testNotes);
    results.notes = testNotes.length;
    console.log(`✅ Created ${testNotes.length} test notes`);

    // Create test note blocks
    console.log('🧩 Creating test note blocks...');
    const testNoteBlocks = testNotes.flatMap((note, noteIndex) =>
      Array.from({ length: 4 }, (_, i) => generateTestNoteBlock(noteIndex + 1, i))
    );
    await db.insert(noteBlocks).values(testNoteBlocks);
    results.noteBlocks = testNoteBlocks.length;
    console.log(`✅ Created ${testNoteBlocks.length} test note blocks`);

    // Create test lessons
    console.log('📚 Creating test lessons...');
    const testLessons = testSpaces.flatMap((space, spaceIndex) =>
      Array.from({ length: 2 }, (_, i) => generateTestLesson(spaceIndex + 1, i))
    );
    await db.insert(lessons).values(testLessons);
    results.lessons = testLessons.length;
    console.log(`✅ Created ${testLessons.length} test lessons`);

    // Create test lesson topics
    console.log('📖 Creating test lesson topics...');
    const testLessonTopics = testLessons.flatMap((lesson, lessonIndex) =>
      Array.from({ length: 3 }, (_, i) => generateTestLessonTopic(lessonIndex + 1, i))
    );
    await db.insert(lessonTopics).values(testLessonTopics);
    results.lessonTopics = testLessonTopics.length;
    console.log(`✅ Created ${testLessonTopics.length} test lesson topics`);

    // Create test progress
    console.log('📊 Creating test progress...');
    const testProgress = [];
    testUsers.forEach((user, userIndex) => {
      testLessons.forEach((lesson, lessonIndex) => {
        // Add progress for lesson
        testProgress.push(generateTestProgress(userIndex + 1, lessonIndex + 1, null));

        // Add progress for some topics
        if (lessonIndex < testLessonTopics.length) {
          const topicId = (lessonIndex * 3) + 1; // First topic of each lesson
          if (topicId <= testLessonTopics.length) {
            testProgress.push(generateTestProgress(userIndex + 1, lessonIndex + 1, topicId));
          }
        }
      });
    });
    await db.insert(progress).values(testProgress);
    results.progress = testProgress.length;
    console.log(`✅ Created ${testProgress.length} test progress records`);

    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${results.users}`);
    console.log(`   Spaces: ${results.spaces}`);
    console.log(`   Space Members: ${results.spaceMembers}`);
    console.log(`   Messages: ${results.messages}`);
    console.log(`   Notes: ${results.notes}`);
    console.log(`   Note Blocks: ${results.noteBlocks}`);
    console.log(`   Lessons: ${results.lessons}`);
    console.log(`   Lesson Topics: ${results.lessonTopics}`);
    console.log(`   Progress Records: ${results.progress}`);
    console.log(`   Total Records: ${Object.values(results).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)}`);

  } catch (error) {
    console.error('❌ Test data generation failed:', error);
    results.errors.push(error instanceof Error ? error.message : String(error));

    console.log('\n❌ Summary of failures:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  return results;
}

// Run the test data generation
main()
  .then((results) => {
    if (results.errors.length === 0) {
      console.log('\n✅ All test data created successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Test data creation completed with some errors');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Critical error:', error);
    process.exit(1);
  });