"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, canUseDashboard, logout } = useAuth();

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
          {!isAuthenticated && (
            <>
              <Link className={isActive(pathname, "/login") ? "active" : ""} href="/login">
                Login
              </Link>
              <Link className={isActive(pathname, "/register") ? "active" : ""} href="/register">
                Register
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              {canUseDashboard && (
                <Link className={isActive(pathname, "/dashboard") ? "active" : ""} href="/dashboard">
                  Dashboard
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