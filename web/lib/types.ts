export type UserRole = "super_admin" | "admin" | "author" | "contributor" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name?: string;
  title: string;
  content: string;
  status: string;
  published_at: string | null;
  created_at?: string | null;
  likes_count: number;
  tags?: string[];
  cover_image_url?: string | null;
  content_format?: string;
}

export interface ContributionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
}

export interface ModerationPost {
  id: string;
  title: string;
  author_id: string;
  submitted_at: string | null;
}

export interface UploadAuthPayload {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface MessageResponse {
  message: string;
}