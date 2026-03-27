"use client";

import type { Post } from "@/lib/types";

type PostCardProps = {
  post: Post;
  showStatus?: boolean;
  canLike?: boolean;
  isLiked?: boolean;
  onToggleLike?: (postId: string, currentlyLiked: boolean) => Promise<void> | void;
  actions?: React.ReactNode;
};

function stripHtml(content: string) {
  return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function excerptFromContent(content: string, maxLength = 140) {
  const normalized = stripHtml(content);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function estimateReadTime(content: string) {
  const words = stripHtml(content).split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function formatPostDate(post: Post) {
  const source = post.published_at || post.created_at;
  if (!source) {
    return "Unscheduled";
  }

  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

export default function PostCard({
  post,
  showStatus = false,
  canLike = false,
  isLiked = false,
  onToggleLike,
  actions
}: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card-top">
        <h3>{post.title}</h3>
        {showStatus && <span className={`status-chip ${post.status}`}>{post.status}</span>}
      </div>

      <p className="post-meta">
        {formatPostDate(post)} · {estimateReadTime(post.content)}
      </p>

      <p className="excerpt">{excerptFromContent(post.content)}</p>

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="tag-row">
          {post.tags.map((tag) => (
            <span className="tag-pill" key={`${post.id}-${tag}`}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="post-card-bottom">
        <span className="likes">{post.likes_count} likes</span>

        <div className="actions-row">
          {canLike && onToggleLike && (
            <button
              type="button"
              className={`like-button ${isLiked ? "liked" : ""}`}
              onClick={() => onToggleLike(post.id, isLiked)}
            >
              {isLiked ? "Unlike" : "Like"}
            </button>
          )}
          {actions}
        </div>
      </div>
    </article>
  );
}