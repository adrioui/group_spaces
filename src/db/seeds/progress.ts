import { db } from '@/db';
import { progress } from '@/db/schema';

async function main() {
    const sampleProgress = [
        // Alice's progress - most advanced
        {
            userId: 1,
            lessonId: 1,
            topicId: 1,
            status: 'completed',
            updatedAt: new Date('2024-01-20T09:30:00').toISOString(),
        },
        {
            userId: 1,
            lessonId: 1,
            topicId: 2,
            status: 'completed',
            updatedAt: new Date('2024-01-20T14:15:00').toISOString(),
        },
        {
            userId: 1,
            lessonId: 1,
            topicId: 3,
            status: 'in_progress',
            updatedAt: new Date('2024-01-21T11:45:00').toISOString(),
        },
        
        // Bob's progress - currently learning
        {
            userId: 2,
            lessonId: 1,
            topicId: 1,
            status: 'completed',
            updatedAt: new Date('2024-01-19T16:20:00').toISOString(),
        },
        {
            userId: 2,
            lessonId: 1,
            topicId: 2,
            status: 'in_progress',
            updatedAt: new Date('2024-01-21T08:30:00').toISOString(),
        },
        {
            userId: 2,
            lessonId: 1,
            topicId: 3,
            status: 'not_started',
            updatedAt: new Date('2024-01-18T10:00:00').toISOString(),
        },
        
        // Carol's progress - hasn't started yet
        {
            userId: 3,
            lessonId: 1,
            topicId: 1,
            status: 'not_started',
            updatedAt: new Date('2024-01-18T09:00:00').toISOString(),
        },
        {
            userId: 3,
            lessonId: 1,
            topicId: 2,
            status: 'not_started',
            updatedAt: new Date('2024-01-18T09:00:00').toISOString(),
        },
        {
            userId: 3,
            lessonId: 1,
            topicId: 3,
            status: 'not_started',
            updatedAt: new Date('2024-01-18T09:00:00').toISOString(),
        },
    ];

    await db.insert(progress).values(sampleProgress);
    
    console.log('✅ Progress seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
