const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const AUTH_APP_ID = import.meta.env.VITE_AUTH_APP_ID;
const AUTH_API_KEY = import.meta.env.VITE_AUTH_API_KEY;
const AUTH_CALLBACK_URL = import.meta.env.VITE_AUTH_CALLBACK_URL;
const AUTH_EXCHANGE_URL = import.meta.env.VITE_AUTH_EXCHANGE_URL;

export interface ExternalAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ExternalAuthTenant {
  id: string;
  name: string;
  owner_user_id: string;
  owner_email: string;
  organization_name: string;
  status: string;
}

export interface ExternalAuthResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: ExternalAuthUser;
    application: {
      id: string;
    };
    tenant: ExternalAuthTenant;
    has_access: boolean;
    available_plans: any[];
  };
}

export function getAuthLoginUrl(): string {
  const params = new URLSearchParams({
    app_id: AUTH_APP_ID,
    redirect_uri: AUTH_CALLBACK_URL,
    api_key: AUTH_API_KEY,
  });

  return `${AUTH_URL}/login?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<ExternalAuthResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(AUTH_EXCHANGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        code: code,
        application_id: AUTH_APP_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exchange error:', errorText);

      let errorMessage = `Failed to exchange code for token: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.includes('CODE_ALREADY_USED')) {
          errorMessage = 'CODE_ALREADY_USED';
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        if (errorText.includes('CODE_ALREADY_USED')) {
          errorMessage = 'CODE_ALREADY_USED';
        }
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network error during authentication');
  }
}

export function parseCallbackUrl(url: string): { code: string | null; state: string | null } {
  const urlObj = new URL(url);
  const code = urlObj.searchParams.get('code');
  const state = urlObj.searchParams.get('state');

  return { code, state };
}

export function storeAuthData(authData: ExternalAuthResponse['data']): void {
  localStorage.setItem('external_auth_token', authData.access_token);
  localStorage.setItem('external_auth_refresh_token', authData.refresh_token);
  localStorage.setItem('external_auth_user', JSON.stringify(authData.user));
  localStorage.setItem('external_auth_tenant', JSON.stringify(authData.tenant));
  localStorage.setItem('external_auth_expires_at', String(Date.now() + authData.expires_in * 1000));
}

export function getStoredAuthData(): {
  token: string | null;
  refreshToken: string | null;
  user: ExternalAuthUser | null;
  tenant: ExternalAuthTenant | null;
  expiresAt: number | null;
} {
  const token = localStorage.getItem('external_auth_token');
  const refreshToken = localStorage.getItem('external_auth_refresh_token');
  const userStr = localStorage.getItem('external_auth_user');
  const tenantStr = localStorage.getItem('external_auth_tenant');
  const expiresAtStr = localStorage.getItem('external_auth_expires_at');

  return {
    token,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
    tenant: tenantStr ? JSON.parse(tenantStr) : null,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr) : null,
  };
}

export function clearAuthData(): void {
  localStorage.removeItem('external_auth_token');
  localStorage.removeItem('external_auth_refresh_token');
  localStorage.removeItem('external_auth_user');
  localStorage.removeItem('external_auth_tenant');
  localStorage.removeItem('external_auth_expires_at');
}

export function isTokenExpired(): boolean {
  const expiresAtStr = localStorage.getItem('external_auth_expires_at');
  if (!expiresAtStr) return true;

  const expiresAt = parseInt(expiresAtStr);
  return Date.now() >= expiresAt;
}
