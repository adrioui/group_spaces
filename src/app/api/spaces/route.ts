import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { spaces, spaceMembers, users } from '@/db/schema';
import { eq, like, or, and, desc, count } from 'drizzle-orm';

// Helper function to extract userId from auth (placeholder)
function getUserIdFromRequest(request: NextRequest): string {
  // In real implementation, extract from auth session/JWT
  // For demo purposes, using header
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new Error('Authentication required');
  return userId;
}

// GET - List spaces by user membership
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get spaces where user is a member
    const userSpaces = await db
      .select({
        id: spaces.id,
        name: spaces.name,
        slug: spaces.slug,
        description: spaces.description,
        coverImageUrl: spaces.coverImageUrl,
        themeColor: spaces.themeColor,
        createdAt: spaces.createdAt,
        updatedAt: spaces.updatedAt,
        ownerId: spaces.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
        userRole: spaceMembers.role,
        userStatus: spaceMembers.status,
      })
      .from(spaces)
      .innerJoin(spaceMembers, eq(spaces.id, spaceMembers.spaceId))
      .innerJoin(users, eq(spaces.ownerId, users.id))
      .where(
        and(
          eq(spaceMembers.userId, userId),
          eq(spaceMembers.status, 'active'),
          search ? or(
            like(spaces.name, `%${search}%`),
            like(spaces.description, `%${search}%`)
          ) : undefined
        )
      )
      .orderBy(desc(spaces.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(userSpaces);
  } catch (error) {
    console.error('GET spaces error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST - Create new space
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { name, description, coverImageUrl, themeColor } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: "Space name is required", 
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug exists
    const existingSpace = await db.select().from(spaces).where(eq(spaces.slug, slug)).limit(1);
    if (existingSpace.length > 0) {
      return NextResponse.json({ 
        error: "A space with this name already exists", 
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create space
    const newSpace = await db.insert(spaces).values({
      ownerId: userId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      coverImageUrl: coverImageUrl || null,
      themeColor: themeColor || '#3B82F6',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create space membership for owner
    await db.insert(spaceMembers).values({
      spaceId: newSpace[0].id,
      userId: userId,
      role: 'owner',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(newSpace[0], { status: 201 });
  } catch (error) {
    console.error('POST spaces error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// PUT - Update space
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('id');

    if (!spaceId || isNaN(parseInt(spaceId))) {
      return NextResponse.json({
        error: "Valid space ID is required",
        code: "INVALID_SPACE_ID"
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);

    // Check user permissions (admin or owner)
    const membership = await db
      .select()
      .from(spaceMembers)
      .where(
        and(
          eq(spaceMembers.spaceId, spaceIdNum),
          eq(spaceMembers.userId, userId),
          eq(spaceMembers.status, 'active')
        )
      )
      .limit(1);

    if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json({ 
        error: "Permission denied. Only space owners and admins can update space details.", 
        code: "INSUFFICIENT_PERMISSIONS" 
      }, { status: 403 });
    }

    const updates = await request.json();
    const { name, description, coverImageUrl, themeColor } = updates;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ 
          error: "Space name cannot be empty", 
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) updateData.description = description?.trim() || null;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl || null;
    if (themeColor !== undefined) updateData.themeColor = themeColor || '#3B82F6';

    const updatedSpace = await db
      .update(spaces)
      .set(updateData)
      .where(eq(spaces.id, spaceIdNum))
      .returning();

    if (updatedSpace.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSpace[0]);
  } catch (error) {
    console.error('PUT spaces error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}
