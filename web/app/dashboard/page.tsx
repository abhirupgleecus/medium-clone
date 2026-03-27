"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import PostCard from "@/components/PostCard";
import RichTextEditor, { isEditorContentEmpty, toEditorHtml } from "@/components/RichTextEditor";
import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";

const MAX_COVER_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function parseTags(rawValue: string) {
  return [...new Set(rawValue.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function validateCoverImage(file: File) {
  const sizeMb = file.size / (1024 * 1024);

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Cover image must be JPG, PNG, WEBP, or GIF.";
  }

  if (sizeMb > MAX_COVER_IMAGE_SIZE_MB) {
    return `Cover image must be smaller than ${MAX_COVER_IMAGE_SIZE_MB}MB.`;
  }

  return null;
}

export default function DashboardPage() {
  const { isAuthenticated, canUseDashboard, loading, user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [createCoverImageUrl, setCreateCoverImageUrl] = useState("");
  const [uploadingCreateCover, setUploadingCreateCover] = useState(false);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("");
  const [uploadingEditCover, setUploadingEditCover] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isContributor = user?.role === "contributor";

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

  const onUploadCoverImage = async (
    event: ChangeEvent<HTMLInputElement>,
    mode: "create" | "edit"
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const invalidMessage = validateCoverImage(file);
    if (invalidMessage) {
      setErrorMessage(invalidMessage);
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "create") {
        setUploadingCreateCover(true);
      } else {
        setUploadingEditCover(true);
      }

      const url = await api.uploadCoverImage(file);

      if (mode === "create") {
        setCreateCoverImageUrl(url);
      } else {
        setEditCoverImageUrl(url);
      }

      setSuccessMessage("Cover image uploaded.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to upload cover image";
      setErrorMessage(message);
    } finally {
      if (mode === "create") {
        setUploadingCreateCover(false);
      } else {
        setUploadingEditCover(false);
      }

      event.target.value = "";
    }
  };

  const onCreatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    if (isEditorContentEmpty(content)) {
      setErrorMessage("Content is required.");
      return;
    }

    try {
      const created = await api.createPost({
        title,
        content,
        tags: parseTags(tags),
        cover_image_url: createCoverImageUrl || null
      });

      setPosts((previous) => [created, ...previous]);
      setTitle("");
      setContent("");
      setTags("");
      setCreateCoverImageUrl("");
      setSuccessMessage("Draft saved.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to create post";
      setErrorMessage(message);
    }
  };

  const beginEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(toEditorHtml(post.content));
    setEditCoverImageUrl(post.cover_image_url || "");
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle("");
    setEditContent("");
    setEditCoverImageUrl("");
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPostId) {
      return;
    }

    if (!editTitle.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    if (isEditorContentEmpty(editContent)) {
      setErrorMessage("Content is required.");
      return;
    }

    setBusyPostId(editingPostId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await api.updatePost(editingPostId, {
        title: editTitle,
        content: editContent,
        cover_image_url: editCoverImageUrl || null
      });

      setPosts((previous) => previous.map((post) => (post.id === updated.id ? updated : post)));
      setSuccessMessage("Draft updated.");
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

  const onSubmitForReview = async (postId: string) => {
    setBusyPostId(postId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.submitPostForReview(postId);
      setPosts((previous) =>
        previous.map((post) => (post.id === postId ? { ...post, status: "in_review" } : post))
      );
      setSuccessMessage("Post submitted for review.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to submit post for review";
      setErrorMessage(message);
    } finally {
      setBusyPostId(null);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="narrow-layout">
        <section className="single-column-card">
          <h1>Dashboard</h1>
          <p className="muted-text">
            Please <Link href="/login">sign in</Link> to access your writing workspace.
          </p>
        </section>
      </div>
    );
  }

  if (!loading && isAuthenticated && !canUseDashboard) {
    return (
      <div className="narrow-layout">
        <section className="single-column-card">
          <h1>Dashboard Restricted</h1>
          <p className="muted-text">
            Your role is view-only. Contributors, authors, and admins can create posts.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <p className="eyebrow">Writer workspace</p>
        <h1>Manage your stories</h1>
        <p>
          {isContributor
            ? "Create drafts and submit them for admin review before publishing."
            : "Create drafts, refine your edits, and publish when each piece is ready."}
        </p>
      </section>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
      {successMessage.length > 0 && <p className="success-text">{successMessage}</p>}

      <div className="compose-grid">
        <section className="single-column-card">
          <h2>Write a new story</h2>
          <form className="form-stack" onSubmit={onCreatePost}>
            <label htmlFor="create-title">Title</label>
            <input
              id="create-title"
              onChange={(event) => setTitle(event.target.value)}
              required
              type="text"
              value={title}
            />

            <RichTextEditor
              id="create-content"
              label="Story content"
              placeholder="Start writing your story here..."
              value={content}
              onChange={setContent}
            />

            <label htmlFor="create-cover">Cover image</label>
            <div className="upload-row">
              <input
                id="create-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  void onUploadCoverImage(event, "create");
                }}
              />
              {uploadingCreateCover && <span className="muted-text">Uploading...</span>}
            </div>
            {createCoverImageUrl && (
              <div className="cover-preview">
                <div className="cover-preview-media" style={{ backgroundImage: `url(${createCoverImageUrl})` }} />
                <button className="secondary" onClick={() => setCreateCoverImageUrl("")} type="button">
                  Remove cover
                </button>
              </div>
            )}

            <label htmlFor="create-tags">Topics (comma separated)</label>
            <input
              id="create-tags"
              onChange={(event) => setTags(event.target.value)}
              placeholder="tech, backend, design"
              type="text"
              value={tags}
            />

            <button type="submit">Save draft</button>
          </form>
        </section>

        {editingPostId && (
          <section className="single-column-card">
            <h2>Edit draft</h2>
            <form className="form-stack" onSubmit={saveEdit}>
              <label htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                onChange={(event) => setEditTitle(event.target.value)}
                required
                type="text"
                value={editTitle}
              />

              <RichTextEditor
                id="edit-content"
                label="Story content"
                placeholder="Update your story..."
                value={editContent}
                onChange={setEditContent}
                disabled={busyPostId === editingPostId}
              />

              <label htmlFor="edit-cover">Cover image</label>
              <div className="upload-row">
                <input
                  id="edit-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    void onUploadCoverImage(event, "edit");
                  }}
                />
                {uploadingEditCover && <span className="muted-text">Uploading...</span>}
              </div>
              {editCoverImageUrl && (
                <div className="cover-preview">
                  <div className="cover-preview-media" style={{ backgroundImage: `url(${editCoverImageUrl})` }} />
                  <button className="secondary" onClick={() => setEditCoverImageUrl("")} type="button">
                    Remove cover
                  </button>
                </div>
              )}

              <div className="inline-actions">
                <button disabled={busyPostId === editingPostId} type="submit">
                  {busyPostId === editingPostId ? "Saving..." : "Save changes"}
                </button>
                <button className="secondary" onClick={cancelEdit} type="button">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

      <section className="stack-md">
        <div className="section-heading">
          <h2>Drafts</h2>
          <p>Unpublished stories currently in progress</p>
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
                    {isContributor ? (
                      <button
                        className="secondary"
                        disabled={busyPostId === post.id}
                        onClick={() => onSubmitForReview(post.id)}
                        type="button"
                      >
                        Submit for review
                      </button>
                    ) : (
                      <button
                        className="secondary"
                        disabled={busyPostId === post.id}
                        onClick={() => onPublish(post.id)}
                        type="button"
                      >
                        Publish
                      </button>
                    )}
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
          <h2>All posts</h2>
          <p>Your complete publishing history</p>
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