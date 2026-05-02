import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/profile");

  let profile = null;
  let error = null;

  try {
    const res = await fetch(`${process.env.BLOG_API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    profile = await res.json();
  } catch (e) {
    error = e.message;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Signed in as <strong>{session.user?.email}</strong></p>
      {error && <p style={{ color: "crimson" }}>Failed to load profile: {error}</p>}
      {profile && (
        <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 4 }}>
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
    </div>
  );
}
