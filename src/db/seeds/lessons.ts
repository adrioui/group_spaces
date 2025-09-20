import { db } from '@/db';
import { lessons } from '@/db/schema';

async function main() {
    const creationDate = new Date();
    creationDate.setDate(creationDate.getDate() - 7);

    const sampleLessons = [
        {
            spaceId: 1,
            title: 'Agile Collaboration Fundamentals',
            description: 'Learn the basics of agile methodology and how to collaborate effectively in cross-functional teams',
            coverImageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            availability: 'always',
            availableAt: null,
            createdAt: creationDate.toISOString(),
            updatedAt: creationDate.toISOString(),
        }
    ];

    await db.insert(lessons).values(sampleLessons);
    
    console.log('✅ Lessons seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
