import { db } from '@/db';
import { notifications } from '@/db/schema';

async function main() {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const currentTime = now.toISOString();

    const sampleNotifications = [
        {
            userId: 1,
            type: 'space_invite',
            payload: JSON.stringify({ space_name: "Design System Guide", inviter: "Carol Davis" }),
            read: 1,
            createdAt: twoDaysAgo,
        },
        {
            userId: 1,
            type: 'note_assigned',
            payload: JSON.stringify({ note_title: "Q4 Product Roadmap", assigner: "Alice Johnson" }),
            read: 0,
            createdAt: oneDayAgo,
        },
        {
            userId: 1,
            type: 'message_mention',
            payload: JSON.stringify({ space_name: "Product Development Hub", message: "Alice, can you review the roadmap?" }),
            read: 0,
            createdAt: sixHoursAgo,
        },
        {
            userId: 2,
            type: 'space_invite',
            payload: JSON.stringify({ space_name: "Design System Guide", inviter: "Carol Davis" }),
            read: 0,
            createdAt: oneDayAgo,
        },
        {
            userId: 2,
            type: 'lesson_progress',
            payload: JSON.stringify({ lesson_title: "Agile Collaboration Fundamentals", topic: "Effective Communication in Teams" }),
            read: 1,
            createdAt: twelveHoursAgo,
        },
        {
            userId: 3,
            type: 'note_published',
            payload: JSON.stringify({ note_title: "Q4 Product Roadmap", author: "Alice Johnson" }),
            read: 1,
            createdAt: oneDayAgo,
        },
        {
            userId: 3,
            type: 'new_member',
            payload: JSON.stringify({ space_name: "Design System Guide", member: "Bob Smith" }),
            read: 0,
            createdAt: oneDayAgo,
        }
    ];

    await db.insert(notifications).values(sampleNotifications);
    
    console.log('✅ Notifications seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
