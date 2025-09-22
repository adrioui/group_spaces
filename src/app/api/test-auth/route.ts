import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Just test if the auth object can be created without errors
    return Response.json({ success: true, hasAuth: !!auth });
  } catch (error: any) {
    console.error('Auth config error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
