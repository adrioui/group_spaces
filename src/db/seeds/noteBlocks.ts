import { db } from '@/db';
import { noteBlocks } from '@/db/schema';

async function main() {
    const sampleNoteBlocks = [
        {
            noteId: 1,
            type: 'text',
            content: JSON.stringify({ text: "# Q4 Objectives\n\nOur main goals for Q4 include launching the collaboration features and improving user onboarding." }),
            position: 1,
            createdAt: new Date('2024-01-15T10:00:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:00:00').toISOString(),
        },
        {
            noteId: 1,
            type: 'todo',
            content: JSON.stringify({ text: "Complete user testing for new collaboration features", completed: false }),
            position: 2,
            createdAt: new Date('2024-01-15T10:05:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:05:00').toISOString(),
        },
        {
            noteId: 1,
            type: 'todo',
            content: JSON.stringify({ text: "Design updated onboarding flow", completed: true }),
            position: 3,
            createdAt: new Date('2024-01-15T10:10:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:10:00').toISOString(),
        },
        {
            noteId: 1,
            type: 'link',
            content: JSON.stringify({ url: "https://figma.com/roadmap-mockups", title: "Roadmap Mockups" }),
            position: 4,
            createdAt: new Date('2024-01-15T10:15:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:15:00').toISOString(),
        },
        {
            noteId: 2,
            type: 'text',
            content: JSON.stringify({ text: "## Component Updates Needed\n\nWe need to update several components based on recent accessibility audit." }),
            position: 1,
            createdAt: new Date('2024-01-16T14:00:00').toISOString(),
            updatedAt: new Date('2024-01-16T14:00:00').toISOString(),
        },
        {
            noteId: 2,
            type: 'todo',
            content: JSON.stringify({ text: "Update button focus states", completed: false }),
            position: 2,
            createdAt: new Date('2024-01-16T14:05:00').toISOString(),
            updatedAt: new Date('2024-01-16T14:05:00').toISOString(),
        },
        {
            noteId: 2,
            type: 'todo',
            content: JSON.stringify({ text: "Add ARIA labels to form components", completed: false }),
            position: 3,
            createdAt: new Date('2024-01-16T14:10:00').toISOString(),
            updatedAt: new Date('2024-01-16T14:10:00').toISOString(),
        },
        {
            noteId: 2,
            type: 'link',
            content: JSON.stringify({ url: "https://storybook.company.com", title: "Component Storybook" }),
            position: 4,
            createdAt: new Date('2024-01-16T14:15:00').toISOString(),
            updatedAt: new Date('2024-01-16T14:15:00').toISOString(),
        },
    ];

    await db.insert(noteBlocks).values(sampleNoteBlocks);
    
    console.log('✅ Note blocks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
