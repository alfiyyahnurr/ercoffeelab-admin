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
    const errorMessage =
      data && typeof data === 'object' && 'error' in data && data.error
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}: ${response.statusText}`;

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
