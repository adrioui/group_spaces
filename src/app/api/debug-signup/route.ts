import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    console.log('Debug signup started...');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    // Check if auth object exists
    console.log('Auth object exists:', !!auth);
    console.log('Auth type:', typeof auth);
    console.log('Auth keys:', Object.keys(auth));
    
    // Check if api exists
    console.log('Auth.api exists:', !!auth.api);
    
    if (auth.api) {
      console.log('Auth.api keys:', Object.keys(auth.api));
      console.log('signUpEmail function exists:', typeof auth.api.signUpEmail === 'function');
    }
    
    return Response.json({ 
      success: true, 
      authExists: !!auth,
      apiExists: !!auth.api,
      body
    });
    
  } catch (error: any) {
    console.error('Debug signup error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
