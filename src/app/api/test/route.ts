import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, spaces } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Simple query to test database connection
    const usersList = await db.select().from(users).limit(5);
    const spacesList = await db.select().from(spaces).limit(5);

    return NextResponse.json({
      message: "Database connection successful",
      usersCount: usersList.length,
      spacesCount: spacesList.length,
      users: usersList,
      spaces: spacesList
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed: ' + error,
      type: typeof error,
      details: error.toString()
    }, { status: 500 });
  }
}
