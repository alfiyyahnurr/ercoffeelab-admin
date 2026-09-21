import { getStoredToken } from './auth';

/**
 * Central API fetch wrapper for communicating with the ERCoffeeLab backend API.
 * Automatically injects the Authorization Bearer header if a stored token exists.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const token = getStoredToken();

  // Do not set Content-Type header if sending FormData (browser sets boundary automatically)
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any = null;
  if (isJson) {
    const rawText = await response.text();
    if (rawText && rawText.trim()) {
      try {
        data = JSON.parse(rawText.trim());
      } catch {
        // Fallback cleanup if response text contains trailing non-whitespace characters
        const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {
            data = null;
          }
        }
      }
    }
  }

  if (!response.ok) {
    let errorMessage =
      data && typeof data === 'object' && 'error' in data && data.error
        ? (data as { error: string }).error
        : null;

    if (!errorMessage) {
      if (response.status === 401) {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      } else if (response.status === 403) {
        errorMessage = 'Anda tidak memiliki hak akses untuk melakukan aksi ini.';
      } else if (response.status === 404) {
        errorMessage = 'Data atau endpoint yang dituju tidak ditemukan (404).';
      } else if (response.status >= 500) {
        errorMessage = `Terjadi kendala pada server backend (Status ${response.status}). Silakan coba lagi.`;
      } else {
        errorMessage = response.statusText
          ? `Request gagal (${response.status}: ${response.statusText})`
          : `Request gagal dengan status ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  return data as T;
}

/**
 * Resolves full image URL for product thumbnails.
 */
export function getImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
