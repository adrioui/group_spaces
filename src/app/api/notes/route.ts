import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes, spaceMembers, users, notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Helper function to extract userId from auth (placeholder)
function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new Error('Authentication required');
  return userId;
}

// Helper function to check space membership
async function checkSpaceMembership(userId: string, spaceId: number): Promise<{ isMember: boolean; role?: string }> {
  const membership = await db
    .select({ role: spaceMembers.role })
    .from(spaceMembers)
    .where(
      and(
        eq(spaceMembers.userId, userId),
        eq(spaceMembers.spaceId, spaceId),
        eq(spaceMembers.status, 'active')
      )
    )
    .limit(1);
  
  return membership.length > 0 ? { isMember: true, role: membership[0].role } : { isMember: false };
}

// GET - List notes or get single note
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');
    const spaceId = searchParams.get('spaceId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const authorId = searchParams.get('authorId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single note by ID
    if (noteId) {
      const noteIdNum = parseInt(noteId);
      if (isNaN(noteIdNum)) {
        return NextResponse.json({
          error: "Invalid note ID",
          code: "INVALID_NOTE_ID"
        }, { status: 400 });
      }

      const noteWithDetails = await db
        .select({
          id: notes.id,
          title: notes.title,
          status: notes.status,
          dueAt: notes.dueAt,
          publishedAt: notes.publishedAt,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
          spaceId: notes.spaceId,
          authorId: notes.authorId,
          authorName: users.name,
          authorEmail: users.email,
          assignedTo: notes.assignedTo,
        })
        .from(notes)
        .innerJoin(users, eq(notes.authorId, users.id))
        .where(eq(notes.id, noteIdNum))
        .limit(1);

      if (noteWithDetails.length === 0) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      const note = noteWithDetails[0];
      
      // Check if user has access to the space
      const { isMember } = await checkSpaceMembership(userId, note.spaceId);
      if (!isMember) {
        return NextResponse.json({ 
          error: "Access denied", 
          code: "ACCESS_DENIED" 
        }, { status: 403 });
      }

      // Get assignee details if assigned
      let assigneeDetails = null;
      if (note.assignedTo) {
        const assigneeIdNum = parseInt(note.assignedTo);
        const assignee = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, assigneeIdNum))
          .limit(1);
        assigneeDetails = assignee[0] || null;
      }

      return NextResponse.json({
        ...note,
        author: {
          id: note.authorId,
          name: note.authorName,
          email: note.authorEmail,
        },
        assignee: assigneeDetails,
      });
    }

    // List notes by space
    if (!spaceId || isNaN(parseInt(spaceId))) {
      return NextResponse.json({
        error: "Valid space ID is required",
        code: "MISSING_SPACE_ID"
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);

    // Check if user has access to this space
    const { isMember } = await checkSpaceMembership(userId, spaceIdNum);
    if (!isMember) {
      return NextResponse.json({ 
        error: "Access denied", 
        code: "ACCESS_DENIED" 
      }, { status: 403 });
    }

    // Build query conditions
    let conditions = [eq(notes.spaceId, spaceIdNum)];

    if (status) conditions.push(eq(notes.status, status));
    if (assignedTo) {
      const assignedToNum = parseInt(assignedTo);
      if (!isNaN(assignedToNum)) {
        conditions.push(eq(notes.assignedTo, assignedToNum));
      }
    }
    if (authorId) conditions.push(eq(notes.authorId, authorId));

    const notesList = await db
      .select({
        id: notes.id,
        title: notes.title,
        status: notes.status,
        dueAt: notes.dueAt,
        publishedAt: notes.publishedAt,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        authorId: notes.authorId,
        authorName: users.name,
        assignedTo: notes.assignedTo,
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(notesList);
  } catch (error) {
    console.error('GET notes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST - Create new note
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { spaceId, title, assignedTo, dueAt, status = 'draft' } = await request.json();

    if (!spaceId || !title) {
      return NextResponse.json({ 
        error: "Space ID and title are required", 
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(spaceId))) {
      return NextResponse.json({
        error: "Invalid space ID",
        code: "INVALID_SPACE_ID"
      }, { status: 400 });
    }

    const spaceIdNum = parseInt(spaceId);

    // Check if user is member of the space
    const { isMember } = await checkSpaceMembership(userId, spaceIdNum);
    if (!isMember) {
      return NextResponse.json({ 
        error: "Access denied", 
        code: "ACCESS_DENIED" 
      }, { status: 403 });
    }

    const now = new Date().toISOString();
    const publishedAt = status === 'published' ? now : null;

    const newNote = await db.insert(notes).values({
      spaceId: spaceIdNum,
      authorId: userId,
      title: title.trim(),
      status: status,
      assignedTo: assignedTo || null,
      dueAt: dueAt || null,
      publishedAt,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json(newNote[0], { status: 201 });
  } catch (error) {
    console.error('POST notes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// PUT - Update note
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId || isNaN(parseInt(noteId))) {
      return NextResponse.json({
        error: "Valid note ID is required",
        code: "INVALID_NOTE_ID"
      }, { status: 400 });
    }

    const noteIdNum = parseInt(noteId);

    // Get note details to check permissions
    const noteDetails = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteIdNum))
      .limit(1);

    if (noteDetails.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = noteDetails[0];

    // Check permissions (author or space admin/owner)
    const { isMember, role } = await checkSpaceMembership(userId, note.spaceId);
    if (!isMember || (note.authorId !== userId && !['admin', 'owner'].includes(role!))) {
      return NextResponse.json({ 
        error: "Permission denied", 
        code: "INSUFFICIENT_PERMISSIONS" 
      }, { status: 403 });
    }

    const updates = await request.json();
    const { title, status, assignedTo, dueAt } = updates;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ 
          error: "Title cannot be empty", 
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
      // Set publishedAt when publishing
      if (status === 'published' && note.publishedAt === null) {
        updateData.publishedAt = updateData.updatedAt;
      }
    }

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (dueAt !== undefined) updateData.dueAt = dueAt || null;

    const updatedNote = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, noteIdNum))
      .returning();

    // After successful update, if this action just published the note, create notifications for members
    if (status === 'published' && note.publishedAt === null) {
      const now = new Date().toISOString();
      // Get all active members of the space
      const members = await db
        .select({ userId: spaceMembers.userId })
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, note.spaceId),
            eq(spaceMembers.status, 'active')
          )
        );

      const payload = JSON.stringify({ note_title: updatedNote[0].title, author_id: note.authorId });

      const toNotify = members.filter((m) => m.userId !== userId);
      if (toNotify.length > 0) {
        await db.insert(notifications).values(
          toNotify.map((m) => ({
            userId: m.userId,
            type: 'note_published',
            payload,
            read: 0,
            createdAt: now,
          }))
        );
      }
    }

    return NextResponse.json(updatedNote[0]);
  } catch (error) {
    console.error('PUT notes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// DELETE - Delete note
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId || isNaN(parseInt(noteId))) {
      return NextResponse.json({
        error: "Valid note ID is required",
        code: "INVALID_NOTE_ID"
      }, { status: 400 });
    }

    const noteIdNum = parseInt(noteId);

    // Get note details to check permissions
    const noteDetails = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteIdNum))
      .limit(1);

    if (noteDetails.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = noteDetails[0];

    // Check permissions (author or space admin/owner)
    const { isMember, role } = await checkSpaceMembership(userId, note.spaceId);
    if (!isMember || (note.authorId !== userId && !['admin', 'owner'].includes(role!))) {
      return NextResponse.json({ 
        error: "Permission denied", 
        code: "INSUFFICIENT_PERMISSIONS" 
      }, { status: 403 });
    }

    await db.delete(notes).where(eq(notes.id, noteIdNum));

    return NextResponse.json({
      message: "Note deleted successfully",
      deletedNoteId: noteIdNum
    });
  } catch (error) {
    console.error('DELETE notes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}
