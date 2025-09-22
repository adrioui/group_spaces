import { db } from '@/db';
import { user } from '@/db/schema';

export async function GET() {
  try {
    const users = await db.select().from(user).limit(1);
    return Response.json({ success: true, userCount: users.length });
  } catch (error: any) {
    console.error('Database error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
