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
  permissions: string[];
  metadata: Record<string, any>;
  created_at: string;
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
    const authBaseUrl = Deno.env.get('VITE_AUTH_URL') || 'http://auth.emplysys.com';
    const authApiKey = Deno.env.get('VITE_AUTH_API_KEY')!;
    const authAppId = Deno.env.get('VITE_AUTH_APP_ID')!;

    const authApiUrl = `${authBaseUrl}/api/users`;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching users from external API:', authApiUrl);

    const response = await fetch(authApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-ID': authAppId,
        'X-API-Key': authApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    const data: ExternalAPIResponse = await response.json();

    if (!data.success || !data.users) {
      throw new Error('Invalid response from external API');
    }

    console.log(`Found ${data.users.length} users to sync`);

    let syncedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const user of data.users) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from('app_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          errors.push(`Error checking user ${user.email}: ${fetchError.message}`);
          continue;
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

        if (existing) {
          const { error: updateError } = await supabase
            .from('app_users')
            .update({
              ...userData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (updateError) {
            errors.push(`Error updating user ${user.email}: ${updateError.message}`);
          } else {
            updatedCount++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('app_users')
            .insert(userData);

          if (insertError) {
            errors.push(`Error inserting user ${user.email}: ${insertError.message}`);
          } else {
            syncedCount++;
          }
        }
      } catch (userError) {
        errors.push(`Error processing user ${user.email}: ${userError.message}`);
      }
    }

    const result = {
      success: true,
      message: 'User sync completed',
      stats: {
        total: data.users.length,
        synced: syncedCount,
        updated: updatedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

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
        message: `Error en sincronización: ${error.message}`,
        stats: {
          total: 0,
          synced: 0,
          updated: 0,
          errors: 1,
        },
        errors: [error.message],
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  }
});