import Link from "next/link";

type AppHeaderProps = {
  currentPath?: string;
  dashboardSlug?: string | null;
};

export default function AppHeader({
  currentPath,
  dashboardSlug,
}: AppHeaderProps) {
  const dashboardHref = dashboardSlug ? `/dashboard/${dashboardSlug}` : "/login";
  const demoHref = "/chat/leeds-kitchen-co";

  return (
    <header
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "24px 24px 0 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          color: "#111827",
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        TradeMate
      </Link>

      <nav
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <NavLink href="/" currentPath={currentPath}>
          Home
        </NavLink>
        <NavLink href="/signup" currentPath={currentPath}>
          Sign up
        </NavLink>
        <NavLink href="/login" currentPath={currentPath}>
          Login
        </NavLink>
        <NavLink href={dashboardHref} currentPath={currentPath}>
          Dashboard
        </NavLink>
        <Link
          href={demoHref}
          style={{
            textDecoration: "none",
            color: "#ffffff",
            background: "#111827",
            fontWeight: 700,
            padding: "10px 14px",
            borderRadius: 12,
          }}
        >
          Demo chat
        </Link>
      </nav>
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
      style={{
        textDecoration: "none",
        color: active ? "#111827" : "#374151",
        background: active ? "#ffffff" : "transparent",
        border: active ? "1px solid #e5e7eb" : "1px solid transparent",
        fontWeight: 700,
        padding: "10px 12px",
        borderRadius: 12,
      }}
    >
      {children}
    </Link>
  );
}