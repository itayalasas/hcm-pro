import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

interface SyncUserRequest {
  user: User;
}

interface ExternalAPIResponse {
  success: boolean;
  users: User[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el usuario del body de la request (POST)
    const body: SyncUserRequest = await req.json();

    if (!body.user) {
      throw new Error('User data is required');
    }

    const user = body.user;

    console.log(`Syncing user: ${user.email} (${user.id})`);

    // Verificar si el usuario ya existe
    const { data: existing, error: fetchError } = await supabase
      .from('app_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Error checking user: ${fetchError.message}`);
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      metadata: user.metadata,
      is_active: true,
      last_sync_at: new Date().toISOString(),
    };

    let result;

    if (existing) {
      // Actualizar usuario existente
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Error updating user: ${updateError.message}`);
      }

      result = {
        success: true,
        message: 'User updated successfully',
        user: userData,
        action: 'updated',
      };
    } else {
      // Insertar nuevo usuario
      const { error: insertError } = await supabase
        .from('app_users')
        .insert(userData);

      if (insertError) {
        throw new Error(`Error inserting user: ${insertError.message}`);
      }

      result = {
        success: true,
        message: 'User synced successfully',
        user: userData,
        action: 'created',
      };
    }

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});