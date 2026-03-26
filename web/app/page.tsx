"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PostCard from "@/components/PostCard";
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
        setTopPosts(posts.slice(0, 5));
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load top posts";
        setErrorMessage(message);
      } finally {
        setLoadingTop(false);
      }
    };

    loadTopPosts();
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

  const latestPosts = useMemo(() => feedPosts.slice(0, 5), [feedPosts]);
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
        <p className="eyebrow">Publishing Platform</p>
        <h1>{isAuthenticated ? "Your Feed" : "Welcome to InkWell"}</h1>
        <p>
          {isAuthenticated
            ? "Explore published stories, search by content, filter by tag, and react with likes in real time."
            : "Discover top stories and the latest published posts from the community."}
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

      <section className="stack-md">
        <div className="section-heading">
          <h2>Top Posts</h2>
        </div>

        {loadingTop ? (
          <p className="muted-text">Loading top posts...</p>
        ) : topPosts.length === 0 ? (
          <p className="muted-text">No top posts found.</p>
        ) : (
          <div className="post-grid">
            {topPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                canLike={isAuthenticated && busyLikePostId !== post.id}
                isLiked={likedPostIds.has(post.id)}
                onToggleLike={handleLikeToggle}
              />
            ))}
          </div>
        )}
      </section>

      {!isAuthenticated && (
        <section className="stack-md">
          <div className="section-heading">
            <h2>Latest Posts</h2>
          </div>

          {loadingFeed ? (
            <p className="muted-text">Loading latest posts...</p>
          ) : latestPosts.length === 0 ? (
            <p className="muted-text">No published posts yet.</p>
          ) : (
            <div className="post-grid">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      )}

      {isAuthenticated && (
        <section className="stack-md">
          <div className="section-heading">
            <h2>Main Feed</h2>
          </div>

          {loadingFeed ? (
            <p className="muted-text">Loading feed...</p>
          ) : feedPosts.length === 0 ? (
            <p className="muted-text">No posts match your search/filter.</p>
          ) : (
            <div className="post-grid">
              {feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canLike={busyLikePostId !== post.id}
                  isLiked={likedPostIds.has(post.id)}
                  onToggleLike={handleLikeToggle}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}