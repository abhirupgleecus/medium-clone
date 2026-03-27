"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { roleCanModerate } from "@/lib/auth";
import type { ContributionRequest, ModerationPost } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

function sortByCreatedDateDesc<T extends { created_at?: string; submitted_at?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aValue = new Date((a.created_at || a.submitted_at || "")).getTime();
    const bValue = new Date((b.created_at || b.submitted_at || "")).getTime();

    return (Number.isNaN(bValue) ? 0 : bValue) - (Number.isNaN(aValue) ? 0 : aValue);
  });
}

export default function ModerationPage() {
  const { loading, isAuthenticated, user } = useAuth();

  const [requestQueue, setRequestQueue] = useState<ContributionRequest[]>([]);
  const [postQueue, setPostQueue] = useState<ModerationPost[]>([]);

  const [requestSearch, setRequestSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");

  const [loadingQueues, setLoadingQueues] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canModerate = useMemo(() => roleCanModerate(user?.role), [user?.role]);

  const loadQueues = useCallback(async () => {
    if (!isAuthenticated || !canModerate) {
      setLoadingQueues(false);
      return;
    }

    setLoadingQueues(true);
    setErrorMessage("");

    try {
      const [requests, posts] = await Promise.all([
        api.listContributionRequests(),
        api.listModerationQueue()
      ]);

      setRequestQueue(sortByCreatedDateDesc(requests));
      setPostQueue(sortByCreatedDateDesc(posts));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load moderation queues";
      setErrorMessage(message);
    } finally {
      setLoadingQueues(false);
    }
  }, [isAuthenticated, canModerate]);

  useEffect(() => {
    if (!loading) {
      void loadQueues();
    }
  }, [loading, loadQueues]);

  const filteredRequestQueue = useMemo(() => {
    const keyword = requestSearch.trim().toLowerCase();
    if (!keyword) {
      return requestQueue;
    }

    return requestQueue.filter((item) => {
      const haystack = `${item.user_id} ${item.reason || ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [requestQueue, requestSearch]);

  const filteredPostQueue = useMemo(() => {
    const keyword = postSearch.trim().toLowerCase();
    if (!keyword) {
      return postQueue;
    }

    return postQueue.filter((item) => {
      const haystack = `${item.title} ${item.author_id}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [postQueue, postSearch]);

  const onApproveRequest = async (requestId: string) => {
    setBusyId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.approveContributionRequest(requestId);
      setRequestQueue((prev) => prev.filter((item) => item.id !== requestId));
      setSuccessMessage("Contribution request approved.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to approve request";
      setErrorMessage(message);
    } finally {
      setBusyId(null);
    }
  };

  const onRejectRequest = async (requestId: string) => {
    setBusyId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.rejectContributionRequest(requestId);
      setRequestQueue((prev) => prev.filter((item) => item.id !== requestId));
      setSuccessMessage("Contribution request rejected.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to reject request";
      setErrorMessage(message);
    } finally {
      setBusyId(null);
    }
  };

  const onApprovePost = async (postId: string) => {
    setBusyId(postId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.approveModerationPost(postId);
      setPostQueue((prev) => prev.filter((item) => item.id !== postId));
      setSuccessMessage("Post approved and published.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to approve post";
      setErrorMessage(message);
    } finally {
      setBusyId(null);
    }
  };

  const onRejectPost = async (postId: string) => {
    const note = window.prompt("Optional rejection note", "Needs more revision");

    setBusyId(postId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.rejectModerationPost(postId, note || undefined);
      setPostQueue((prev) => prev.filter((item) => item.id !== postId));
      setSuccessMessage("Post rejected.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to reject post";
      setErrorMessage(message);
    } finally {
      setBusyId(null);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="narrow-layout">
        <section className="single-column-card">
          <h1>Moderation</h1>
          <p className="muted-text">
            Please <Link href="/login">sign in</Link> to continue.
          </p>
        </section>
      </div>
    );
  }

  if (!loading && isAuthenticated && !canModerate) {
    return (
      <div className="narrow-layout">
        <section className="single-column-card">
          <h1>Moderation Restricted</h1>
          <p className="muted-text">Only admins and super admins can access this queue.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <p className="eyebrow">Moderation workspace</p>
        <h1>Review requests and submissions</h1>
        <p>Approve contributor access and verify submitted stories before they go live.</p>
      </section>

      {errorMessage.length > 0 && <p className="error-text">{errorMessage}</p>}
      {successMessage.length > 0 && <p className="success-text">{successMessage}</p>}

      <div className="settings-grid">
        <section className="single-column-card moderation-panel">
          <div className="section-heading">
            <h2>Contribution Requests</h2>
            <p>{filteredRequestQueue.length} shown</p>
          </div>

          <div className="form-stack">
            <label htmlFor="request-search">Search requests</label>
            <input
              id="request-search"
              type="text"
              placeholder="Search by user id or reason"
              value={requestSearch}
              onChange={(event) => setRequestSearch(event.target.value)}
            />
          </div>

          {loadingQueues ? (
            <p className="muted-text">Loading requests...</p>
          ) : filteredRequestQueue.length === 0 ? (
            <p className="muted-text">No pending contribution requests.</p>
          ) : (
            <div className="moderation-list">
              {filteredRequestQueue.map((item) => (
                <article className="moderation-item" key={item.id}>
                  <p className="moderation-title">User: {item.user_id.slice(0, 8)}...</p>
                  <p className="muted-text">Requested: {formatDate(item.created_at)}</p>
                  <p className="muted-text">Reason: {item.reason || "No reason provided."}</p>
                  <div className="inline-actions">
                    <button disabled={busyId === item.id} onClick={() => onApproveRequest(item.id)} type="button">
                      Approve
                    </button>
                    <button className="danger" disabled={busyId === item.id} onClick={() => onRejectRequest(item.id)} type="button">
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="single-column-card moderation-panel">
          <div className="section-heading">
            <h2>Review Queue</h2>
            <p>{filteredPostQueue.length} shown</p>
          </div>

          <div className="form-stack">
            <label htmlFor="post-search">Search submitted posts</label>
            <input
              id="post-search"
              type="text"
              placeholder="Search by title or author id"
              value={postSearch}
              onChange={(event) => setPostSearch(event.target.value)}
            />
          </div>

          {loadingQueues ? (
            <p className="muted-text">Loading posts...</p>
          ) : filteredPostQueue.length === 0 ? (
            <p className="muted-text">No posts currently in review.</p>
          ) : (
            <div className="moderation-list">
              {filteredPostQueue.map((item) => (
                <article className="moderation-item" key={item.id}>
                  <p className="moderation-title">{item.title}</p>
                  <p className="muted-text">Author: {item.author_id.slice(0, 8)}...</p>
                  <p className="muted-text">Submitted: {formatDate(item.submitted_at)}</p>
                  <div className="inline-actions">
                    <button disabled={busyId === item.id} onClick={() => onApprovePost(item.id)} type="button">
                      Approve
                    </button>
                    <button className="danger" disabled={busyId === item.id} onClick={() => onRejectPost(item.id)} type="button">
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}