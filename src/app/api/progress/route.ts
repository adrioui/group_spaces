import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { progress, lessons, spaceMembers } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

function getUserIdFromRequest(request: NextRequest): number {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Authentication required");
  return parseInt(userId);
}

async function ensureLessonAccess(userId: number, lessonId: number) {
  // Check user is active member of the lesson's space
  const membership = await db
    .select({ id: spaceMembers.id })
    .from(spaceMembers)
    .innerJoin(lessons, eq(spaceMembers.spaceId, lessons.spaceId))
    .where(
      and(
        eq(lessons.id, lessonId),
        eq(spaceMembers.userId, userId),
        eq(spaceMembers.status, "active")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error("ACCESS_DENIED");
  }
}

// GET /api/progress?lessonId=
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId || isNaN(parseInt(lessonId))) {
      return NextResponse.json({ error: "Valid lesson ID is required", code: "MISSING_LESSON_ID" }, { status: 400 });
    }

    await ensureLessonAccess(userId, parseInt(lessonId));

    const progressRows = await db
      .select()
      .from(progress)
      .where(and(eq(progress.lessonId, parseInt(lessonId)), eq(progress.userId, userId)))
      .orderBy(desc(progress.updatedAt));

    return NextResponse.json(progressRows);
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("GET progress error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

// POST /api/progress
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { lessonId, topicId, status } = await request.json();

    if (!lessonId || !status) {
      return NextResponse.json({ error: "lessonId and status are required", code: "MISSING_FIELDS" }, { status: 400 });
    }

    if (isNaN(parseInt(lessonId))) {
      return NextResponse.json({ error: "Invalid lesson ID", code: "INVALID_LESSON_ID" }, { status: 400 });
    }

    if (!["not_started", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status", code: "INVALID_STATUS" }, { status: 400 });
    }

    await ensureLessonAccess(userId, parseInt(lessonId));

    const now = new Date().toISOString();

    // Check if progress record already exists
    const existing = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.lessonId, parseInt(lessonId)),
          eq(progress.userId, userId),
          topicId ? eq(progress.topicId, topicId) : undefined
        )
      )
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Update existing record
      const updated = await db
        .update(progress)
        .set({ status, updatedAt: now })
        .where(eq(progress.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      // Create new record
      const inserted = await db
        .insert(progress)
        .values({
          userId,
          lessonId: parseInt(lessonId),
          topicId: topicId || null,
          status,
          updatedAt: now,
        })
        .returning();
      result = inserted[0];
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Access denied", code: "ACCESS_DENIED" }, { status: 403 });
    }
    console.error("POST progress error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}