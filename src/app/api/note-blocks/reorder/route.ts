import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { noteBlocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest as _NextRequest } from "next/server";

function getUserIdFromRequest(request: NextRequest): number {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Authentication required");
  return parseInt(userId);
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const payload = await request.json();

    if (!Array.isArray(payload) || payload.length === 0) {
      return NextResponse.json({ error: "Payload must be a non-empty array", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    // Fetch blocks to ensure same note and access
    const ids = payload.map((p: any) => Number(p.id)).filter((n: any) => !isNaN(n));
    if (ids.length !== payload.length) {
      return NextResponse.json({ error: "Invalid block IDs in payload", code: "INVALID_IDS" }, { status: 400 });
    }

    const blocks = await db.select().from(noteBlocks).where(eq(noteBlocks.id, ids[0]));
    // Simple approach: check the first, then fetch all to validate noteId consistency
    const fetched = await db.query.noteBlocks.findMany({ where: (nb, { inArray }) => inArray(nb.id, ids) });
    if (fetched.length !== ids.length) {
      return NextResponse.json({ error: "Some blocks not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const noteId = fetched[0].noteId;
    if (!fetched.every((b) => b.noteId === noteId)) {
      return NextResponse.json({ error: "Blocks must belong to the same note", code: "MIXED_NOTES" }, { status: 400 });
    }

    // Ensure access using one of the base route helpers (re-implement minimal here)
    // We cannot import helper across files; re-check membership via join
    // Import notes and spaceMembers lazily to avoid circular deps in some envs
    const { notes, spaceMembers } = await import("@/db/schema");
    const membership = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .innerJoin(notes, eq(spaceMembers.spaceId, notes.spaceId))
      .where(and(eq(notes.id, noteId), eq(spaceMembers.userId, userId), eq(spaceMembers.status, "active")));

    if (!membership.length) {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }

    // Update each block position
    for (const item of payload) {
      await db
        .update(noteBlocks)
        .set({ position: Number(item.position), updatedAt: new Date().toISOString() })
        .where(eq(noteBlocks.id, Number(item.id)));
    }

    return NextResponse.json({ message: "Reordered successfully" });
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("PUT note-blocks/reorder error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}
