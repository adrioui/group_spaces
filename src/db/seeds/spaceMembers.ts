import { db } from '@/db';
import { spaceMembers } from '@/db/schema';

async function main() {
    const sampleSpaceMembers = [
        // Product Development Hub (spaceId: 1) members
        {
            spaceId: 1,
            userId: 1,
            role: 'owner',
            status: 'active',
            createdAt: new Date('2024-01-15T10:00:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:00:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 2,
            role: 'admin',
            status: 'active',
            createdAt: new Date('2024-01-16T14:30:00').toISOString(),
            updatedAt: new Date('2024-01-16T14:30:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 3,
            role: 'member',
            status: 'active',
            createdAt: new Date('2024-01-18T09:15:00').toISOString(),
            updatedAt: new Date('2024-01-18T09:15:00').toISOString(),
        },
        // Design System Guide (spaceId: 2) members
        {
            spaceId: 2,
            userId: 3,
            role: 'owner',
            status: 'active',
            createdAt: new Date('2024-02-01T11:00:00').toISOString(),
            updatedAt: new Date('2024-02-01T11:00:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 1,
            role: 'admin',
            status: 'active',
            createdAt: new Date('2024-02-05T16:45:00').toISOString(),
            updatedAt: new Date('2024-02-05T16:45:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 2,
            role: 'member',
            status: 'invited',
            createdAt: new Date('2024-02-08T13:20:00').toISOString(),
            updatedAt: new Date('2024-02-08T13:20:00').toISOString(),
        },
    ];

    await db.insert(spaceMembers).values(sampleSpaceMembers);
    
    console.log('✅ Space members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
