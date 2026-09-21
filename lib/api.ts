const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Full URL for links the browser opens directly (e.g. document downloads).
// Auth cookies go along automatically.
export function apiUrl(endpoint: string) {
  return `${API_URL}${endpoint}`;
}

/*
 * API client, fully cookie-based authentication.
 *
 * - No token storage in JavaScript (HttpOnly cookies handle it)
 * - credentials: "include" tells the browser to send cookies
 * - X-Requested-With header for CSRF protection
 * - Automatic token refresh on 401 responses
 */

async function handleResponse<T>(response: Response): Promise<T> {
  // 204 means "success, no content" (like after DELETE)
  // There is no body to parse, so return undefined
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  // if the response is not ok (status 400, 401, 404, 422 etc.)
  // throw the error so the calling component can catch it

  if (!response.ok) {
    throw {
      status: response.status,
      ...data.error,
    };
  }
  return data;
}

// Sends the request with auth cookies, and retries once after refreshing
// the session if the access token has expired.
async function fetchWithRefresh(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  // Build the headers object
  // JSON requests get Content-Type: application/json. File uploads
  // (FormData) must not set it: the browser adds the multipart boundary.
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    // CSRF protection, backend verifies this header exists
    // Browser prevent cross origin JS from setting custom headers
    "X-Requested-With": "XMLHttpRequest",
    ...(options.headers as Record<string, string>),
  };

  // Make the actual HTTP request to your Express API
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // If 401 and not already a refresh/login/register request, try refresh
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/me")
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }
  return response;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetchWithRefresh(endpoint, options);
  return handleResponse<T>(response);
}

// For file responses (e.g. PDF previews): returns the raw bytes as a Blob
async function requestBlob(endpoint: string): Promise<Blob> {
  const response = await fetchWithRefresh(endpoint, { method: "GET" });
  if (!response.ok) {
    // Errors still come back as our standard JSON error body
    await handleResponse(response);
  }
  return response.blob();
}

async function tryRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Public API methods
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  getBlob: (endpoint: string) => requestBlob(endpoint),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: "POST", body: formData }),
};
