"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AppHeaderProps = {
  currentPath?: string;
  dashboardSlug?: string | null;
};

export default function AppHeader({
  currentPath,
  dashboardSlug,
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardHref = dashboardSlug ? `/dashboard/${dashboardSlug}` : "/login";
  const demoHref = "/chat/leeds-kitchen-co";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/signup", label: "Sign up" },
    { href: "/login", label: "Login" },
    { href: dashboardHref, label: "Dashboard" },
  ];

  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl"
        >
          TradeMate
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={`${item.href}-${item.label}`}
                href={item.href}
                currentPath={currentPath}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link
            href={demoHref}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Demo chat
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 md:hidden"
        >
          <span className="sr-only">
            {mobileMenuOpen ? "Close menu" : "Open menu"}
          </span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-gray-200 md:hidden"
        >
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-4 py-3 sm:px-6">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <MobileNavLink
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  currentPath={currentPath}
                >
                  {item.label}
                </MobileNavLink>
              ))}
            </nav>

            <Link
              href={demoHref}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Demo chat
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  currentPath,
  children,
}: {
  href: string;
  currentPath?: string;
  children: React.ReactNode;
}) {
  const active = currentPath === href;

  return (
    <Link
      href={href}
      className={[
        "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
        active
          ? "border border-gray-200 bg-gray-50 text-gray-900"
          : "border border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  currentPath,
  children,
}: {
  href: string;
  currentPath?: string;
  children: React.ReactNode;
}) {
  const active = currentPath === href;

  return (
    <Link
      href={href}
      className={[
        "flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold transition",
        active
          ? "border border-gray-200 bg-gray-50 text-gray-900"
          : "border border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}