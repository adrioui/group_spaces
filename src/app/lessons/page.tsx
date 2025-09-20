"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function useAppUserId() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const syncUser = async () => {
      if (!session?.user?.email) { setLoading(false); return; }
      try {
        const res = await fetch("/api/users", { headers: { "Content-Type": "application/json" } });
        const list = await res.json();
        const match = Array.isArray(list) ? list.find((u: any) => u.email?.toLowerCase() === session.user.email.toLowerCase()) : null;
        if (match) { setUserId(match.id); return; }
        const createRes = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: session.user.email, name: session.user.name || session.user.email.split("@")[0], avatarUrl: session.user.image || undefined, bio: "" }) });
        const created = await createRes.json();
        if (created?.id) setUserId(created.id);
      } catch {}
      finally { setLoading(false); }
    };
    syncUser();
  }, [session?.user?.email, session?.user?.name, session?.user?.image]);
  return { userId, loading };
}

export default function LessonsListPage() {
  const { data: session, isPending } = useSession();
  const { userId, loading } = useAppUserId();
  const bearer = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null), []);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setError(null);
      try {
        const res = await fetch(`/api/lessons`, { headers: { "Content-Type": "application/json", Authorization: bearer ? `Bearer ${bearer}` : "", "x-user-id": String(userId) } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load lessons");
        setItems(data);
      } catch (e: any) {
        setError(e.message || "Failed to load lessons");
      }
    };
    if (userId) load();
  }, [userId, bearer]);

  if (isPending || loading) {
    return <div className="min-h-dvh grid place-items-center p-6"><p className="text-sm text-muted-foreground">Loading lessons...</p></div>;
  }
  if (!session?.user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Lessons</h1>
          <p className="text-sm text-muted-foreground">Browse lessons from your spaces</p>
        </div>
        <Button asChild>
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>

      {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      {items.length === 0 ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">No lessons yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <div className="h-24 w-full bg-muted" style={{ backgroundImage: `url(${l.coverImageUrl || "https://images.unsplash.com/photo-1496307653780-42ee777d4833?q=80&w=1200&auto=format&fit=crop"})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <CardHeader>
                <CardTitle className="text-base">{l.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{l.description || ""}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Availability: {l.availability}</span>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/lessons/${l.id}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
