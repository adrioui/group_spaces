import { db } from '@/db';
import { notes } from '@/db/schema';

async function main() {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const sampleNotes = [
        {
            spaceId: 1,
            authorId: 1,
            title: 'Q4 Product Roadmap',
            status: 'published',
            assignedTo: 2,
            dueAt: twoWeeksFromNow.toISOString(),
            publishedAt: yesterday.toISOString(),
            createdAt: yesterday.toISOString(),
            updatedAt: yesterday.toISOString(),
        },
        {
            spaceId: 2,
            authorId: 3,
            title: 'Component Library Updates',
            status: 'draft',
            assignedTo: null,
            dueAt: null,
            publishedAt: null,
            createdAt: threeDaysAgo.toISOString(),
            updatedAt: threeDaysAgo.toISOString(),
        }
    ];

    await db.insert(notes).values(sampleNotes);
    
    console.log('✅ Notes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
