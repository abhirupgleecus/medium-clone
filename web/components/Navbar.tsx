"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { roleCanModerate } from "@/lib/auth";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, canUseDashboard, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="main-nav-wrap">
      <nav className="main-nav">
        <Link href="/" className="brand">
          InkWell
        </Link>

        <div className="nav-links">
          <Link className={isActive(pathname, "/") ? "active" : ""} href="/">
            Home
          </Link>

          {!isAuthenticated && (
            <>
              <Link className={isActive(pathname, "/login") ? "active" : ""} href="/login">
                Sign in
              </Link>
              <Link className={isActive(pathname, "/register") ? "active" : ""} href="/register">
                Get started
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              {canUseDashboard && (
                <Link className={isActive(pathname, "/dashboard") ? "active" : ""} href="/dashboard">
                  Write
                </Link>
              )}
              {roleCanModerate(user?.role) && (
                <Link className={isActive(pathname, "/moderation") ? "active" : ""} href="/moderation">
                  Moderation
                </Link>
              )}
              <Link className={isActive(pathname, "/profile") ? "active" : ""} href="/profile">
                Profile
              </Link>
              <button className="link-like-button" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}