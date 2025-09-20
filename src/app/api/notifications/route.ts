import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

function getUserIdFromRequest(request: NextRequest): number {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Authentication required");
  return parseInt(userId);
}

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

// POST /api/notifications
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { type, payload } = await request.json();

    if (!type || !payload) {
      return NextResponse.json({ error: "type and payload are required", code: "MISSING_FIELDS" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const inserted = await db
      .insert(notifications)
      .values({
        userId,
        type,
        payload: JSON.stringify(payload),
        read: false,
        createdAt: now,
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error("POST notifications error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}

// PUT /api/notifications?id=&read=true
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const read = searchParams.get("read");

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid notification ID is required", code: "INVALID_NOTIFICATION_ID" }, { status: 400 });
    }

    if (read === null || read === undefined) {
      return NextResponse.json({ error: "read status is required", code: "MISSING_READ_STATUS" }, { status: 400 });
    }

    const updated = await db
      .update(notifications)
      .set({ read: read === "true" })
      .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PUT notifications error:", error);
    return NextResponse.json({ error: "Internal server error: " + error }, { status: 500 });
  }
}
