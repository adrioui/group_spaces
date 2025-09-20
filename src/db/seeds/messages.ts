import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const sampleMessages = [
        // Space 1 messages (Product Development Hub) - 10 messages
        {
            spaceId: 1,
            userId: 1,
            content: 'Hey team! Just finished implementing the user authentication flow. The new onboarding experience is looking great!',
            attachments: JSON.stringify([{
                type: 'image',
                name: 'onboarding-flow.png',
                url: 'https://example.com/uploads/onboarding-flow.png',
                size: 245783
            }]),
            createdAt: new Date('2024-01-15T09:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T09:30:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 2,
            content: 'Awesome work! I reviewed the code this morning. The passwordless auth implementation looks solid. Should we add social login options too?',
            attachments: null,
            createdAt: new Date('2024-01-15T10:15:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:15:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 3,
            content: 'Social login is definitely on our roadmap. Let me check with product - we might want to prioritize Google sign-in first since most of our users have Gmail accounts.',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'user-analytics-jan2024.pdf',
                url: 'https://example.com/uploads/user-analytics-jan2024.pdf',
                size: 562341
            }]),
            createdAt: new Date('2024-01-15T11:22:00').toISOString(),
            updatedAt: new Date('2024-01-15T11:22:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 1,
            content: 'Great idea! I can start working on Google OAuth integration. Should we also consider Apple Sign In for our iOS users?',
            attachments: null,
            createdAt: new Date('2024-01-15T11:45:00').toISOString(),
            updatedAt: new Date('2024-01-15T11:45:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 2,
            content: 'Let\'s focus on Google for now and circle back to Apple. The API documentation is attached - we should follow the OAuth 2.0 best practices outlined here.',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'oauth-implementation-guide.md',
                url: 'https://example.com/uploads/oauth-implementation-guide.md',
                size: 12847
            }]),
            createdAt: new Date('2024-01-15T14:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T14:30:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 3,
            content: 'Quick update: The performance improvements are showing great results! Page load time is down by 45% after implementing lazy loading for images.',
            attachments: JSON.stringify([{
                type: 'image',
                name: 'performance-metrics.png',
                url: 'https://example.com/uploads/performance-metrics.png',
                size: 194532
            }]),
            createdAt: new Date('2024-01-15T16:20:00').toISOString(),
            updatedAt: new Date('2024-01-15T16:20:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 1,
            content: 'That\'s fantastic! Should we consider implementing a CDN for static assets to improve it even further?',
            attachments: null,
            createdAt: new Date('2024-01-15T16:45:00').toISOString(),
            updatedAt: new Date('2024-01-15T16:45:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 3,
            content: 'Absolutely! I was thinking CloudFlare or AWS CloudFront. Let\'s schedule a meeting tomorrow to discuss the implementation plan. How about 2 PM?',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'cdn-comparison.md',
                url: 'https://example.com/uploads/cdn-comparison.md',
                size: 8923
            }]),
            createdAt: new Date('2024-01-15T17:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T17:30:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 2,
            content: '2 PM works for me. I\'ll prepare a brief on costs and integration complexity. This could really improve our international users\' experience.',
            attachments: null,
            createdAt: new Date('2024-01-15T18:15:00').toISOString(),
            updatedAt: new Date('2024-01-15T18:15:00').toISOString(),
        },
        {
            spaceId: 1,
            userId: 1,
            content: 'Perfect! I\'ll create the meeting invite with the agenda. Thanks everyone for the productive discussion today! 🚀',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'meeting-agenda.md',
                url: 'https://example.com/uploads/meeting-agenda.md',
                size: 3456
            }]),
            createdAt: new Date('2024-01-15T19:00:00').toISOString(),
            updatedAt: new Date('2024-01-15T19:00:00').toISOString(),
        },
        // Space 2 messages (Design System Guide) - 10 messages
        {
            spaceId: 2,
            userId: 3,
            content: 'Team, I\'ve started drafting our new color token system. We need to establish a scalable foundation before we expand the components library.',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'color-tokens-draft.json',
                url: 'https://example.com/uploads/color-tokens-draft.json',
                size: 4523
            }]),
            createdAt: new Date('2024-01-15T08:45:00').toISOString(),
            updatedAt: new Date('2024-01-15T08:45:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 1,
            content: 'This looks great! I love how you\'ve organized the semantic colors. Should we include high-contrast variants for accessibility compliance?',
            attachments: null,
            createdAt: new Date('2024-01-15T09:20:00').toISOString(),
            updatedAt: new Date('2024-01-15T09:20:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 3,
            content: 'Absolutely! I\'ve added the high-contrast tokens as a separate variant set. The contrast ratios meet WCAG 2.1 AA standards.',
            attachments: JSON.stringify([{
                type: 'image',
                name: 'contrast-ratio-examples.png',
                url: 'https://example.com/uploads/contrast-ratio-examples.png',
                size: 167832
            }]),
            createdAt: new Date('2024-01-15T10:15:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:15:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 1,
            content: 'Perfect! I think we should also create documentation examples showing improper contrast. This will help the team understand common mistakes.',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'accessibility-checklist.pdf',
                url: 'https://example.com/uploads/accessibility-checklist.pdf',
                size: 78342
            }]),
            createdAt: new Date('2024-01-15T11:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T11:30:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 3,
            content: 'Great suggestion! I\'ll add that to the documentation. Meanwhile, we should also define our typography scale. I propose we use a 1.25 ratio for our type scale.',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'typography-scale.figma',
                url: 'https://example.com/uploads/typography-scale.figma',
                size: 89234
            }]),
            createdAt: new Date('2024-01-15T14:00:00').toISOString(),
            updatedAt: new Date('2024-01-15T14:00:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 1,
            content: 'I agree with the 1.25 ratio, but let\'s test it with our actual content first. Sometimes what looks good in theory doesn\'t work with our specific layout requirements.',
            attachments: null,
            createdAt: new Date('2024-01-15T15:45:00').toISOString(),
            updatedAt: new Date('2024-01-15T15:45:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 2,
            content: 'From a developer perspective, implementing the current typography scale should be straightforward. What about our responsive type scaling?',
            attachments: JSON.stringify([{
                type: 'image',
                name: 'responsive-type-scale.png',
                url: 'https://example.com/uploads/responsive-type-scale.png',
                size: 123456
            }]),
            createdAt: new Date('2024-01-15T16:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T16:30:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 3,
            content: 'Good point! I\'ve updated the Figma file to include responsive breakpoints. We\'re using a fluid type scale that adjusts smoothly between mobile and desktop.',
            attachments: null,
            createdAt: new Date('2024-01-15T17:15:00').toISOString(),
            updatedAt: new Date('2024-01-15T17:15:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 1,
            content: 'This is coming together beautifully! I\'ve scheduled a design-system review for Friday at 3 PM. Let\'s have all tokens and base components finalized by Thursday.',
            attachments: JSON.stringify([{
                type: 'file',
                name: 'design-system-timeline.md',
                url: 'https://example.com/uploads/design-system-timeline.md',
                size: 12340
            }]),
            createdAt: new Date('2024-01-15T18:00:00').toISOString(),
            updatedAt: new Date('2024-01-15T18:00:00').toISOString(),
        },
        {
            spaceId: 2,
            userId: 2,
            content: 'Sounds good! I\'ll have the spacing and layout tokens ready by Wednesday. This system is going to make our design-to-dev handoff so much smoother. Great work everyone! 👏',
            attachments: JSON.stringify([{
                type: 'image',
                name: 'component-preview.png',
                url: 'https://example.com/uploads/component-preview.png',
                size: 89234
            }]),
            createdAt: new Date('2024-01-15T18:45:00').toISOString(),
            updatedAt: new Date('2024-01-15T18:45:00').toISOString(),
        }
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
