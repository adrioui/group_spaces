import { db } from '@/db';
import { lessonTopics } from '@/db/schema';

async function main() {
    const sampleTopics = [
        {
            lessonId: 1,
            title: 'Introduction to Agile Principles',
            body: 'Agile methodology emphasizes collaboration, flexibility, and iterative development. In this topic, we\'ll explore the core principles that make agile teams successful.',
            youtubeUrl: null,
            position: 1,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            lessonId: 1,
            title: 'Effective Communication in Teams',
            body: 'Communication is the backbone of successful collaboration. Learn techniques for clear, consistent communication across different roles and time zones.',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            position: 2,
            createdAt: new Date('2024-01-16').toISOString(),
            updatedAt: new Date('2024-01-16').toISOString(),
        },
        {
            lessonId: 1,
            title: 'Tools for Collaborative Planning',
            body: 'Discover the tools and techniques that help teams plan, track, and execute projects together. From story mapping to retrospectives.',
            youtubeUrl: null,
            position: 3,
            createdAt: new Date('2024-01-17').toISOString(),
            updatedAt: new Date('2024-01-17').toISOString(),
        }
    ];

    await db.insert(lessonTopics).values(sampleTopics);
    
    console.log('✅ Lesson topics seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
