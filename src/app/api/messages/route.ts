import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, spaceMembers, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Helper function to extract userId from auth (placeholder)
function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new Error('Authentication required');
  return userId;
}

// Helper function to check space membership
async function checkSpaceMembership(userId: string, spaceId: number): Promise<boolean> {
  const membership = await db
    .select()
    .from(spaceMembers)
    .where(
      and(
        eq(spaceMembers.userId, userId),
        eq(spaceMembers.spaceId, spaceId),
        eq(spaceMembers.status, 'active')
      )
    )
    .limit(1);
  
  return membership.length > 0;
}

// GET - List messages by space
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!spaceId || isNaN(parseInt(spaceId))) {
      return NextResponse.json({ 
        error: "Valid space ID is required", 
        code: "MISSING_SPACE_ID" 
      }, { status: 400 });
    }

    // Check if user has access to this space
    const spaceIdNum = parseInt(spaceId);
    const hasAccess = await checkSpaceMembership(userId, spaceIdNum);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied. You are not a member of this space.", 
        code: "ACCESS_DENIED" 
      }, { status: 403 });
    }

    // Get messages with user information
    const spaceMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        userId: messages.userId,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatarUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.spaceId, spaceIdNum))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse attachments JSON
    const formattedMessages = spaceMessages.map(message => ({
      ...message,
      attachments: message.attachments ? JSON.parse(message.attachments as string) : null,
      user: {
        id: message.userId,
        name: message.userName,
        email: message.userEmail,
        avatarUrl: message.userAvatar,
      }
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST - Create new message
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { spaceId, content, attachments } = await request.json();

    if (!spaceId || !content) {
      return NextResponse.json({ 
        error: "Space ID and content are required", 
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);
    if (isNaN(spaceIdNum)) {
      return NextResponse.json({
        error: "Invalid space ID",
        code: "INVALID_SPACE_ID"
      }, { status: 400 });
    }

    // Check if user is member of the space
    const hasAccess = await checkSpaceMembership(userId, spaceIdNum);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied. You are not a member of this space.", 
        code: "ACCESS_DENIED" 
      }, { status: 403 });
    }

    // Validate attachments format if provided
    let attachmentsJson = null;
    if (attachments) {
      if (!Array.isArray(attachments)) {
        return NextResponse.json({ 
          error: "Attachments must be an array", 
          code: "INVALID_ATTACHMENTS" 
        }, { status: 400 });
      }
      attachmentsJson = JSON.stringify(attachments);
    }

    const now = new Date().toISOString();

    // Create message
    const newMessage = await db.insert(messages).values({
      spaceId: spaceIdNum,
      userId: userId,
      content: content.trim(),
      attachments: attachmentsJson,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Get message with user details
    const messageWithUser = await db
      .select({
        id: messages.id,
        content: messages.content,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        userId: messages.userId,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatarUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, newMessage[0].id))
      .limit(1);

    const result = {
      ...messageWithUser[0],
      attachments: messageWithUser[0].attachments ? JSON.parse(messageWithUser[0].attachments as string) : null,
      user: {
        id: messageWithUser[0].userId,
        name: messageWithUser[0].userName,
        email: messageWithUser[0].userEmail,
        avatarUrl: messageWithUser[0].userAvatar,
      }
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST messages error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}
