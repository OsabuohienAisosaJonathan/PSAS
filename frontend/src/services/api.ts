import { BreachStatusResult } from '@psas/core';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('psas_admin_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('psas_admin_token', token);
  } else {
    localStorage.removeItem('psas_admin_token');
  }
}

export async function checkBreachByHash(sha256Hash: string): Promise<BreachStatusResult> {
  if (!sha256Hash) {
    return {
      checked: false,
      breached: false,
      message: 'No hash provided.',
      riskLevel: 'NONE'
    };
  }

  try {
    const res = await fetch(`${API_BASE}/breach/check/${sha256Hash}`);
    if (!res.ok) {
      return {
        checked: true,
        breached: false,
        message: 'Local breach lookup unavailable (network or server offline).',
        riskLevel: 'NONE'
      };
    }
    const data = await res.json();
    return data;
  } catch {
    return {
      checked: false,
      breached: false,
      message: 'Local breach server unreachable. Operating in offline evaluation mode.',
      riskLevel: 'NONE'
    };
  }
}

export async function sendAnalysisTelemetry(telemetry: {
  analysis_type: string;
  score: number;
  strength_category: string;
  entropy: number;
  estimated_guesses: string;
  breach_detected: boolean;
  processing_time_ms: number;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/logs/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry)
    });
  } catch {
    // Non-blocking telemetry failure in offline mode
  }
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function apiFetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new Event('psas-auth-logout'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
