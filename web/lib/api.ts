import {
  clearAuthState,
  getAccessToken,
  getRefreshToken,
  getRefreshUserId,
  setAccessToken,
  setRefreshToken
} from "@/lib/auth";
import type { LoginResponse, MessageResponse, Post, User } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Primitive = string | number | boolean;

type QueryParams = Record<string, Primitive | null | undefined>;

type RequestOptions = {
  method?: string;
  auth?: boolean;
  body?: BodyInit | Record<string, unknown> | null;
  headers?: HeadersInit;
  query?: QueryParams;
  retry?: boolean;
};

function buildUrl(path: string, query?: QueryParams) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && `${value}`.trim().length > 0) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length ? text : null;
}

async function tryRefreshAccessToken() {
  const refreshToken = getRefreshToken();
  const userId = getRefreshUserId();

  if (!refreshToken || !userId) {
    return false;
  }

  try {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: userId,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      clearAuthState();
      return false;
    }

    const payload = (await response.json()) as LoginResponse;
    setAccessToken(payload.access_token);
    setRefreshToken(payload.refresh_token);
    return true;
  } catch {
    clearAuthState();
    return false;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    auth = false,
    body = null,
    headers,
    query,
    retry = false
  } = options;

  const requestHeaders = new Headers(headers || {});

  let requestBody: BodyInit | undefined;

  if (body !== null && body !== undefined) {
    if (isBodyInit(body)) {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody
  });

  if (response.status === 401 && auth && !retry) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return request<T>(path, {
        ...options,
        retry: true
      });
    }
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload !== null && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : null) || `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const api = {
  login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.set("username", email);
    formData.set("password", password);

    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: formData
    });
  },

  register(email: string, password: string, fullName: string) {
    return request<MessageResponse>("/auth/register", {
      method: "POST",
      body: {
        email,
        password,
        full_name: fullName
      }
    });
  },

  getCurrentUser() {
    return request<User>("/users/me", {
      auth: true
    });
  },

  listPosts(search?: string, tag?: string) {
    return request<Post[]>("/posts", {
      query: {
        search,
        tag
      }
    });
  },

  listTopPosts() {
    return request<Post[]>("/posts/top");
  },

  listMyPosts() {
    return request<Post[]>("/posts/me", {
      auth: true
    });
  },

  createPost(payload: { title: string; content: string; tags: string[] }) {
    return request<Post>("/posts", {
      method: "POST",
      auth: true,
      body: payload
    });
  },

  updatePost(postId: string, payload: { title?: string; content?: string }) {
    return request<Post>(`/posts/${postId}`, {
      method: "PATCH",
      auth: true,
      body: payload
    });
  },

  deletePost(postId: string) {
    return request<MessageResponse>(`/posts/${postId}`, {
      method: "DELETE",
      auth: true
    });
  },

  publishPost(postId: string) {
    return request<Post>(`/posts/${postId}/publish`, {
      method: "POST",
      auth: true
    });
  },

  likePost(postId: string) {
    return request<MessageResponse>(`/posts/${postId}/like`, {
      method: "POST",
      auth: true
    });
  },

  unlikePost(postId: string) {
    return request<MessageResponse>(`/posts/${postId}/like`, {
      method: "DELETE",
      auth: true
    });
  },

  updateProfile(payload: { full_name?: string; avatar_url?: string }) {
    return request<User>("/users/me", {
      method: "PATCH",
      auth: true,
      body: payload
    });
  },

  changePassword(payload: { current_password: string; new_password: string }) {
    return request<MessageResponse>("/users/me/password", {
      method: "PATCH",
      auth: true,
      body: payload
    });
  }
};