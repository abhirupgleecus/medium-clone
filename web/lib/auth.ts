import type { User, UserRole } from "@/lib/types";

const ACCESS_TOKEN_KEY = "medium_clone_access_token";
const REFRESH_TOKEN_KEY = "medium_clone_refresh_token";
const STORED_USER_KEY = "medium_clone_user";
const LIKED_POST_IDS_KEY = "medium_clone_liked_post_ids";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  if (!canUseStorage()) {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken() {
  if (!canUseStorage()) {
    return null;
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getStoredUser(): User | null {
  if (!canUseStorage()) {
    return null;
  }

  const serializedUser = localStorage.getItem(STORED_USER_KEY);
  if (!serializedUser) {
    return null;
  }

  try {
    return JSON.parse(serializedUser) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
}

export function clearAuthState() {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(STORED_USER_KEY);
  localStorage.removeItem(LIKED_POST_IDS_KEY);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, encodedPayload] = token.split(".");
    if (!encodedPayload) {
      return null;
    }

    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = atob(normalizedPayload);

    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getRefreshUserId() {
  const storedUser = getStoredUser();
  if (storedUser?.id) {
    return storedUser.id;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const subject = payload?.sub;

  if (typeof subject === "string" && subject.length > 0) {
    return subject;
  }

  return null;
}

export function roleCanUseDashboard(role: UserRole | undefined) {
  return role === "author" || role === "admin" || role === "super_admin";
}

export function getLikedPostIds() {
  if (!canUseStorage()) {
    return new Set<string>();
  }

  const serialized = localStorage.getItem(LIKED_POST_IDS_KEY);
  if (!serialized) {
    return new Set<string>();
  }

  try {
    const ids = JSON.parse(serialized) as string[];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

export function setLikedPostIds(postIds: Set<string>) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(LIKED_POST_IDS_KEY, JSON.stringify([...postIds]));
}