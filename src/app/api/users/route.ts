import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const user = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user[0]);
    }
    
    const allUsers = await db.select().from(users).limit(10);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, bio, avatarUrl } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json({ 
        error: "Email and name are required", 
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    
    const newUser = await db.insert(users).values({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      bio: bio?.trim() || null,
      avatarUrl: avatarUrl || null,
      authProviderId: null,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('POST users error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}
