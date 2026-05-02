"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ddd" }}>
      <Link href="/">Home</Link>
      <Link href="/profile">Profile</Link>
      <span style={{ marginLeft: "auto" }}>
        {status === "authenticated" ? (
          <>
            <span style={{ marginRight: 12 }}>{session.user?.email}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          </>
        ) : (
          <Link href="/login">Sign in</Link>
        )}
      </span>
    </nav>
  );
}
