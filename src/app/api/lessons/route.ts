import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lessons, lessonTopics, spaceMembers } from "@/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

function getUserIdFromRequest(request: NextRequest): number {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Authentication required");
  return parseInt(userId);
}

// GET /api/lessons?spaceId= | /api/lessons?id=
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const spaceId = searchParams.get("spaceId");

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ error: "Invalid lesson ID", code: "INVALID_LESSON_ID" }, { status: 400 });
      }
      // Ensure the requesting user is a member of the lesson's space
      const membership = await db
        .select({ id: spaceMembers.id })
        .from(spaceMembers)
        .innerJoin(lessons, eq(spaceMembers.spaceId, lessons.spaceId))
        .where(and(eq(lessons.id, parseInt(id)), eq(spaceMembers.userId, userId), eq(spaceMembers.status, "active")))
        .limit(1);
      if (!membership.length) {
        return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
      }

      // Fetch lesson and topics
      const lessonRows = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, parseInt(id)))
        .limit(1);
      if (!lessonRows.length) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

      const topics = await db
        .select()
        .from(lessonTopics)
        .where(eq(lessonTopics.lessonId, parseInt(id)))
        .orderBy(asc(lessonTopics.position));

      return NextResponse.json({ ...lessonRows[0], topics });
    }

    // List lessons for spaces where user is an active member
    // Optional filter by spaceId
    const memberSpaces = await db
      .select({ spaceId: spaceMembers.spaceId })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.status, "active")));

    const spaceIds = memberSpaces.map((m) => m.spaceId);
    if (spaceIds.length === 0) return NextResponse.json([]);

    const whereClause = spaceId && !isNaN(parseInt(spaceId))
      ? eq(lessons.spaceId, parseInt(spaceId))
      : inArray(lessons.spaceId, spaceIds);

    const list = await db
      .select()
      .from(lessons)
      .where(whereClause)
      .orderBy(desc(lessons.updatedAt));

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET lessons error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

// POST /api/lessons
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { spaceId, title, description, coverImageUrl, availability = "always", availableAt } = await request.json();

    if (!spaceId || !title) {
      return NextResponse.json({ error: "spaceId and title are required", code: "MISSING_FIELDS" }, { status: 400 });
    }

    if (isNaN(parseInt(spaceId))) {
      return NextResponse.json({ error: "Invalid space ID", code: "INVALID_SPACE_ID" }, { status: 400 });
    }

    // Ensure creator is member of the space
    const membership = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .where(and(eq(spaceMembers.spaceId, parseInt(spaceId)), eq(spaceMembers.userId, userId), eq(spaceMembers.status, "active")))
      .limit(1);

    if (!membership.length) {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const inserted = await db
      .insert(lessons)
      .values({
        spaceId: parseInt(spaceId),
        title: title.trim(),
        description: description?.trim() || null,
        coverImageUrl: coverImageUrl || null,
        availability,
        availableAt: availableAt || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error("POST lessons error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

// PUT /api/lessons?id=
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid lesson ID is required", code: "INVALID_LESSON_ID" }, { status: 400 });
    }

    // Ensure user is member of the lesson's space
    const membership = await db
      .select({ id: spaceMembers.id })
      .from(spaceMembers)
      .innerJoin(lessons, eq(spaceMembers.spaceId, lessons.spaceId))
      .where(and(eq(lessons.id, parseInt(id)), eq(spaceMembers.userId, userId), eq(spaceMembers.status, "active")))
      .limit(1);
    if (!membership.length) {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }

    const updates = await request.json();
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (updates.title !== undefined) updateData.title = updates.title?.trim() || null;
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
    if (updates.coverImageUrl !== undefined) updateData.coverImageUrl = updates.coverImageUrl || null;
    if (updates.availability !== undefined) updateData.availability = updates.availability;
    if (updates.availableAt !== undefined) updateData.availableAt = updates.availableAt || null;

    const updated = await db.update(lessons).set(updateData).where(eq(lessons.id, parseInt(id))).returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PUT lessons error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}
