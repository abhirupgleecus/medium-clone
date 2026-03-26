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
  title: string;
  content: string;
  status: string;
  published_at: string | null;
  likes_count: number;
  tags?: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface MessageResponse {
  message: string;
}