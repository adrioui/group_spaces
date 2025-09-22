import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

// Wrap the handler to catch errors
const wrappedHandler = async (request: Request) => {
  try {
    console.log(`🔄 ${request.method} ${request.url}`);
    console.log('Auth object exists:', !!auth);

    // The handler is an object with GET, POST methods, not a function
    const method = request.method;
    const handlerFunction = handler[method];

    if (!handlerFunction) {
      throw new Error(`Method ${method} not supported`);
    }

    const result = await handlerFunction(request);
    console.log('✅ Handler completed successfully');
    return result;
  } catch (error: any) {
    console.error('❌ Better Auth Handler Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET = handler.GET;
export const POST = handler.POST;
