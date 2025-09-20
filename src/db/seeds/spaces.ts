import { db } from '@/db';
import { spaces } from '@/db/schema';

async function main() {
    const sampleSpaces = [
        {
            ownerId: 1,
            name: 'Product Development Hub',
            slug: 'product-dev-hub',
            description: 'Collaborative space for product development team',
            coverImageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop',
            themeColor: '#3B82F6',
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
        {
            ownerId: 3,
            name: 'Design System Guide',
            slug: 'design-system',
            description: 'Design system documentation and guidelines',
            coverImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop',
            themeColor: '#8B5CF6',
            createdAt: new Date('2024-01-22').toISOString(),
            updatedAt: new Date('2024-01-22').toISOString(),
        }
    ];

    await db.insert(spaces).values(sampleSpaces);
    
    console.log('✅ Spaces seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
