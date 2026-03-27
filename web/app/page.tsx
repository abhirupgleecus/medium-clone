"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import SearchBar from "@/components/SearchBar";
import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { getLikedPostIds, setLikedPostIds } from "@/lib/auth";
import type { Post } from "@/lib/types";

function collectTags(posts: Post[]) {
  const uniqueTags = new Set<string>();

  posts.forEach((post) => {
    if (!Array.isArray(post.tags)) {
      return;
    }

    post.tags.forEach((tag) => {
      if (typeof tag === "string" && tag.trim().length > 0) {
        uniqueTags.add(tag.trim().toLowerCase());
      }
    });
  });

  return [...uniqueTags].sort();
}

function updatePostLikes(posts: Post[], postId: string, delta: number) {
  return posts.map((post) => {
    if (post.id !== postId) {
      return post;
    }

    return {
      ...post,
      likes_count: Math.max(0, post.likes_count + delta)
    };
  });
}

function stripHtml(content: string) {
  return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function excerptFromContent(content: string, maxLength = 180) {
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

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getAuthorLabel(post: Post) {
  if (typeof post.author_name === "string" && post.author_name.trim().length > 0) {
    return post.author_name;
  }

  if (typeof post.author_id === "string" && post.author_id.length >= 8) {
    return `Writer ${post.author_id.slice(0, 8)}`;
  }

  return "InkWell Writer";
}

function EditorialPostItem({
  post,
  canLike,
  isLiked,
  isBusy,
  onToggleLike
}: {
  post: Post;
  canLike: boolean;
  isLiked: boolean;
  isBusy: boolean;
  onToggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>;
}) {
  const imageUrl = post.cover_image_url;

  return (
    <article className="editorial-post">
      <div className="editorial-post-main">
        <p className="editorial-post-meta">
          {getAuthorLabel(post)} · {formatPostDate(post)} · {estimateReadTime(post.content)}
        </p>
        <h3 className="editorial-post-title">{post.title}</h3>
        <p className="editorial-post-excerpt">{excerptFromContent(post.content)}</p>

        <div className="editorial-post-footer">
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="tag-row">
              {post.tags.slice(0, 3).map((tag) => (
                <span className="tag-pill" key={`${post.id}-${tag}`}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="inline-actions">
            <span className="likes">{post.likes_count} likes</span>
            {canLike && (
              <button
                type="button"
                className={`like-button ${isLiked ? "liked" : ""}`}
                disabled={isBusy}
                onClick={() => onToggleLike(post.id, isLiked)}
              >
                {isLiked ? "Unlike" : "Like"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className="editorial-post-media"
        aria-hidden="true"
        style={
          imageUrl
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }
            : undefined
        }
      >
        {!imageUrl && <span>No image</span>}
      </div>
    </article>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);

  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [likedPostIds, setLikedPostIdsState] = useState<Set<string>>(new Set());
  const [busyLikePostId, setBusyLikePostId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLikedPostIdsState(getLikedPostIds());
  }, []);

  useEffect(() => {
    const loadTopPosts = async () => {
      setLoadingTop(true);
      try {
        const posts = await api.listTopPosts();
        setTopPosts(posts.slice(0, 6));
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load top posts";
        setErrorMessage(message);
      } finally {
        setLoadingTop(false);
      }
    };

    void loadTopPosts();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setLoadingFeed(true);
      setErrorMessage("");

      try {
        const posts = await api.listPosts(search, activeTag);
        setFeedPosts(posts);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load posts";
        setErrorMessage(message);
      } finally {
        setLoadingFeed(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search, activeTag]);

  const mostRecentPosts = useMemo(() => {
    if (isAuthenticated) {
      return feedPosts;
    }
    return feedPosts.slice(0, 8);
  }, [feedPosts, isAuthenticated]);

  const tags = useMemo(() => collectTags([...topPosts, ...feedPosts]), [topPosts, feedPosts]);

  const handleLikeToggle = async (postId: string, currentlyLiked: boolean) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (busyLikePostId === postId) {
      return;
    }

    const delta = currentlyLiked ? -1 : 1;

    const previousTopPosts = topPosts;
    const previousFeedPosts = feedPosts;
    const nextLikedPostIds = new Set(likedPostIds);

    if (currentlyLiked) {
      nextLikedPostIds.delete(postId);
    } else {
      nextLikedPostIds.add(postId);
    }

    setBusyLikePostId(postId);
    setTopPosts((previous) => updatePostLikes(previous, postId, delta));
    setFeedPosts((previous) => updatePostLikes(previous, postId, delta));
    setLikedPostIdsState(nextLikedPostIds);
    setLikedPostIds(nextLikedPostIds);

    try {
      if (currentlyLiked) {
        await api.unlikePost(postId);
      } else {
        await api.likePost(postId);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update like";
      setErrorMessage(message);

      setTopPosts(previousTopPosts);
      setFeedPosts(previousFeedPosts);
      setLikedPostIdsState(likedPostIds);
      setLikedPostIds(likedPostIds);
    } finally {
      setBusyLikePostId(null);
    }
  };

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <p className="eyebrow">Editorial feed</p>
        <h1>{isAuthenticated ? "Most Recent Stories" : "Stay curious with InkWell"}</h1>
        <p>
          {isAuthenticated
            ? "Browse the latest stories, filter by topic, and react instantly from your personalized feed."
            : "Read top stories and fresh perspectives in a clean editorial experience."}
        </p>
      </section>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}

      {isAuthenticated && (
        <SearchBar
          search={search}
          activeTag={activeTag}
          tags={tags}
          onSearchChange={setSearch}
          onTagChange={setActiveTag}
        />
      )}

      <div className="home-layout">
        <section className="home-main stack-md">
          <div className="section-heading">
            <h2>Most Recent Posts</h2>
            <p>{isAuthenticated ? "Filtered in real time" : "Latest from the community"}</p>
          </div>

          {loadingFeed ? (
            <p className="muted-text">Loading recent stories...</p>
          ) : mostRecentPosts.length === 0 ? (
            <p className="muted-text">No stories available yet.</p>
          ) : (
            <div className="editorial-list">
              {mostRecentPosts.map((post) => (
                <EditorialPostItem
                  key={post.id}
                  post={post}
                  canLike={isAuthenticated}
                  isLiked={likedPostIds.has(post.id)}
                  isBusy={busyLikePostId === post.id}
                  onToggleLike={handleLikeToggle}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="home-rail">
          <section className="top-posts-panel stack-md">
            <div className="section-heading">
              <h2>Top Posts</h2>
              <p>Most liked this week</p>
            </div>

            {loadingTop ? (
              <p className="muted-text">Loading top stories...</p>
            ) : topPosts.length === 0 ? (
              <p className="muted-text">No top posts found.</p>
            ) : (
              <div>
                {topPosts.map((post, index) => (
                  <article className="top-post-item" key={post.id}>
                    <p className="top-post-rank">{String(index + 1).padStart(2, "0")}</p>
                    <div>
                      <h3>{post.title}</h3>
                      <p>
                        {getAuthorLabel(post)} · {estimateReadTime(post.content)} · {post.likes_count} likes
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}