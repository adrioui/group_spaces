// app/api/test-env/route.ts
export async function GET() {
  try {
    const env = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'Set' : 'Missing',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Check if DATABASE_URL has proper format
    let dbUrlValid = false;
    if (process.env.DATABASE_URL) {
      dbUrlValid = process.env.DATABASE_URL.startsWith('postgresql://') && 
                   process.env.DATABASE_URL.includes('@');
    }

    // Check if BETTER_AUTH_SECRET is long enough
    const secretValid = process.env.BETTER_AUTH_SECRET && 
                        process.env.BETTER_AUTH_SECRET.length >= 32;

    return Response.json({ 
      success: true,
      environment: env,
      validation: {
        dbUrlValid,
        secretValid: !!secretValid,
        secretLength: process.env.BETTER_AUTH_SECRET?.length || 0
      }
    });
  } catch (error: any) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
