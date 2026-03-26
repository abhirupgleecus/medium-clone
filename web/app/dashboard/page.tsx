"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import PostCard from "@/components/PostCard";
import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";

function parseTags(rawValue: string) {
  return [...new Set(rawValue.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export default function DashboardPage() {
  const { isAuthenticated, canUseDashboard, loading } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadPosts = useCallback(async () => {
    if (!isAuthenticated || !canUseDashboard) {
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);
    setErrorMessage("");

    try {
      const myPosts = await api.listMyPosts();
      setPosts(myPosts);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load dashboard posts";
      setErrorMessage(message);
    } finally {
      setLoadingPosts(false);
    }
  }, [isAuthenticated, canUseDashboard]);

  useEffect(() => {
    if (!loading) {
      void loadPosts();
    }
  }, [loading, loadPosts]);

  const drafts = useMemo(() => posts.filter((post) => post.status === "draft"), [posts]);

  const onCreatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const created = await api.createPost({
        title,
        content,
        tags: parseTags(tags)
      });

      setPosts((previous) => [created, ...previous]);
      setTitle("");
      setContent("");
      setTags("");
      setSuccessMessage("Draft created.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to create post";
      setErrorMessage(message);
    }
  };

  const beginEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPostId) {
      return;
    }

    setBusyPostId(editingPostId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await api.updatePost(editingPostId, {
        title: editTitle,
        content: editContent
      });

      setPosts((previous) => previous.map((post) => (post.id === updated.id ? updated : post)));
      setSuccessMessage("Post updated.");
      cancelEdit();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update post";
      setErrorMessage(message);
    } finally {
      setBusyPostId(null);
    }
  };

  const onDelete = async (postId: string) => {
    const shouldDelete = window.confirm("Delete this post?");
    if (!shouldDelete) {
      return;
    }

    setBusyPostId(postId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.deletePost(postId);
      setPosts((previous) => previous.filter((post) => post.id !== postId));
      setSuccessMessage("Post deleted.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to delete post";
      setErrorMessage(message);
    } finally {
      setBusyPostId(null);
    }
  };

  const onPublish = async (postId: string) => {
    setBusyPostId(postId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const published = await api.publishPost(postId);
      setPosts((previous) => previous.map((post) => (post.id === published.id ? published : post)));
      setSuccessMessage("Post published.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to publish post";
      setErrorMessage(message);
    } finally {
      setBusyPostId(null);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <section className="single-column-card">
        <h1>Dashboard</h1>
        <p className="muted-text">
          Please <Link href="/login">login</Link> to access your dashboard.
        </p>
      </section>
    );
  }

  if (!loading && isAuthenticated && !canUseDashboard) {
    return (
      <section className="single-column-card">
        <h1>Dashboard Restricted</h1>
        <p className="muted-text">Your role is view-only. Authors and admins can create and publish posts.</p>
      </section>
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <p className="eyebrow">Dashboard</p>
        <h1>Manage Your Writing</h1>
        <p>Create drafts, edit content, publish when ready, and manage your posts from one place.</p>
      </section>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
      {successMessage.length > 0 && <p className="success-text">{successMessage}</p>}

      <section className="single-column-card">
        <h2>Create Post</h2>
        <form className="form-stack" onSubmit={onCreatePost}>
          <label htmlFor="create-title">Title</label>
          <input
            id="create-title"
            onChange={(event) => setTitle(event.target.value)}
            required
            type="text"
            value={title}
          />

          <label htmlFor="create-content">Content</label>
          <textarea
            id="create-content"
            onChange={(event) => setContent(event.target.value)}
            required
            rows={7}
            value={content}
          />

          <label htmlFor="create-tags">Tags (comma separated, optional)</label>
          <input
            id="create-tags"
            onChange={(event) => setTags(event.target.value)}
            placeholder="tech, backend, design"
            type="text"
            value={tags}
          />

          <button type="submit">Create Draft</button>
        </form>
      </section>

      {editingPostId && (
        <section className="single-column-card">
          <h2>Edit Draft</h2>
          <form className="form-stack" onSubmit={saveEdit}>
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              onChange={(event) => setEditTitle(event.target.value)}
              required
              type="text"
              value={editTitle}
            />

            <label htmlFor="edit-content">Content</label>
            <textarea
              id="edit-content"
              onChange={(event) => setEditContent(event.target.value)}
              required
              rows={7}
              value={editContent}
            />

            <div className="inline-actions">
              <button disabled={busyPostId === editingPostId} type="submit">
                {busyPostId === editingPostId ? "Saving..." : "Save"}
              </button>
              <button className="secondary" onClick={cancelEdit} type="button">
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="stack-md">
        <div className="section-heading">
          <h2>Drafts</h2>
        </div>

        {loadingPosts ? (
          <p className="muted-text">Loading drafts...</p>
        ) : drafts.length === 0 ? (
          <p className="muted-text">No drafts yet.</p>
        ) : (
          <div className="post-grid">
            {drafts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showStatus
                actions={
                  <div className="inline-actions">
                    <button className="secondary" onClick={() => beginEdit(post)} type="button">
                      Edit
                    </button>
                    <button
                      className="secondary"
                      disabled={busyPostId === post.id}
                      onClick={() => onPublish(post.id)}
                      type="button"
                    >
                      Publish
                    </button>
                    <button className="danger" disabled={busyPostId === post.id} onClick={() => onDelete(post.id)} type="button">
                      Delete
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="stack-md">
        <div className="section-heading">
          <h2>My Posts</h2>
        </div>

        {loadingPosts ? (
          <p className="muted-text">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="muted-text">No posts found.</p>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showStatus />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}