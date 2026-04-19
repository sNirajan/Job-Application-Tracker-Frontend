const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

async function request<T>
    (
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
    // Build the headers object
    // Every request gets Content-Type: application/json
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        // CSRF protection, backend verifies this header exists
        // Browser prevent cross origin JS from setting custom headers
        "X-Requested-With": "XMLHttpRequest",
        ...(options.headers as Record<string, string>),
    };

    // Make the actual HTTP request to your Express API
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options, headers, credentials: "include",
    });

    // If 401 and not already a refresh/login/register request, try refresh
    if (response.status === 401 && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/me")
    ) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                ...options, headers, credentials: "include",
            });
            return handleResponse<T>(retryResponse);
        }
    }
    return handleResponse<T>(response);
}

async function tryRefresh(): Promise<boolean> {
    try {

        const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest",
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
    get: <T>(endpoint: string) =>
        request<T>(endpoint, { method: "GET" }),

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

    delete: <T>(endpoint: string) =>
        request<T>(endpoint, { method: "DELETE" }),
};