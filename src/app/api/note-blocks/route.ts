import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { noteBlocks, notes, spaceMembers } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

function getUserIdFromRequest(request: NextRequest): number {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Authentication required");
  return parseInt(userId);
}

async function ensureNoteAccess(userId: number, noteId: number) {
  // Check user is active member of the note's space
  const membership = await db
    .select({ id: spaceMembers.id })
    .from(spaceMembers)
    .innerJoin(notes, eq(spaceMembers.spaceId, notes.spaceId))
    .where(
      and(
        eq(notes.id, noteId),
        eq(spaceMembers.userId, userId),
        eq(spaceMembers.status, "active")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error("ACCESS_DENIED");
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId || isNaN(parseInt(noteId))) {
      return NextResponse.json({ error: "Valid note ID is required", code: "MISSING_NOTE_ID" }, { status: 400 });
    }

    await ensureNoteAccess(userId, parseInt(noteId));

    const blocks = await db
      .select()
      .from(noteBlocks)
      .where(eq(noteBlocks.noteId, parseInt(noteId)))
      .orderBy(desc(noteBlocks.position));

    return NextResponse.json(blocks);
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("GET note-blocks error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { noteId, type, content, position } = await request.json();

    if (!noteId || !type || content === undefined || position === undefined) {
      return NextResponse.json({ error: "noteId, type, content and position are required", code: "MISSING_FIELDS" }, { status: 400 });
    }

    if (isNaN(parseInt(noteId))) {
      return NextResponse.json({ error: "Invalid note ID", code: "INVALID_NOTE_ID" }, { status: 400 });
    }

    if (!["text", "todo", "link"].includes(type)) {
      return NextResponse.json({ error: "Invalid block type", code: "INVALID_TYPE" }, { status: 400 });
    }

    await ensureNoteAccess(userId, parseInt(noteId));

    const now = new Date().toISOString();

    const inserted = await db
      .insert(noteBlocks)
      .values({
        noteId: parseInt(noteId),
        type,
        content: JSON.stringify(content),
        position: Number(position),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("POST note-blocks error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid block ID is required", code: "INVALID_BLOCK_ID" }, { status: 400 });
    }

    // Get block to fetch noteId
    const existing = await db.select().from(noteBlocks).where(eq(noteBlocks.id, parseInt(id))).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    await ensureNoteAccess(userId, existing[0].noteId);

    const body = await request.json();
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.position !== undefined) updateData.position = Number(body.position);
    if (body.content !== undefined) updateData.content = JSON.stringify(body.content);
    if (body.type !== undefined) {
      if (!["text", "todo", "link"].includes(body.type)) {
        return NextResponse.json({ error: "Invalid block type", code: "INVALID_TYPE" }, { status: 400 });
      }
      updateData.type = body.type;
    }

    const updated = await db
      .update(noteBlocks)
      .set(updateData)
      .where(eq(noteBlocks.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("PUT note-blocks error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid block ID is required", code: "INVALID_BLOCK_ID" }, { status: 400 });
    }

    // Get block to fetch noteId
    const existing = await db.select().from(noteBlocks).where(eq(noteBlocks.id, parseInt(id))).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    await ensureNoteAccess(userId, existing[0].noteId);

    await db.delete(noteBlocks).where(eq(noteBlocks.id, parseInt(id)));

    return NextResponse.json({ message: "Block deleted", deletedBlockId: parseInt(id) });
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("DELETE note-blocks error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}
