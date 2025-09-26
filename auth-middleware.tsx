import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Context, Next } from 'npm:hono';

export async function authMiddleware(c: Context, next: Next) {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user?.id) {
      console.log('Authentication error:', error);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Store user ID in context for use in routes
    c.set('userId', user.id);
    c.set('user', user);

    await next();
  } catch (error) {
    console.log('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}