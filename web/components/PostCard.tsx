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

function excerptFromContent(content: string, maxLength = 140) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
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
        <span className="likes">Likes: {post.likes_count}</span>

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