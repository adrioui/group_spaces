import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            authProviderId: 'auth_01hrxy1z8nq9v3b2k5m7w4q8e6',
            email: 'alice@example.com',
            name: 'Alice Johnson',
            avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=4CAF50&color=fff&size=200',
            bio: 'Product manager passionate about collaborative learning',
            createdAt: new Date('2024-01-08').toISOString(),
            updatedAt: new Date('2024-01-08').toISOString(),
        },
        {
            authProviderId: 'auth_02ksxz2a9ory4c3l6n8m5r7t9',
            email: 'bob@example.com',
            name: 'Bob Smith',
            avatarUrl: 'https://ui-avatars.com/api/?name=Bob+Smith&background=2196F3&color=fff&size=200',
            bio: 'Full-stack developer who loves building educational tools',
            createdAt: new Date('2024-01-09').toISOString(),
            updatedAt: new Date('2024-01-09').toISOString(),
        },
        {
            authProviderId: 'auth_03ltya3b0psz5d4m7o9n6s8v0',
            email: 'carol@example.com',
            name: 'Carol Davis',
            avatarUrl: 'https://ui-avatars.com/api/?name=Carol+Davis&background=FF9800&color=fff&size=200',
            bio: 'UX designer focused on intuitive learning experiences',
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
