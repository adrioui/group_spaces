"use client"

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function useAppUserId() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }
      try {
        // Try fetch first page of users and find by email (demo schema has few users)
        const res = await fetch("/api/users", { headers: { "Content-Type": "application/json" } });
        const list = await res.json();
        const match = Array.isArray(list) ? list.find((u: any) => u.email?.toLowerCase() === session.user.email.toLowerCase()) : null;
        if (match) {
          setUserId(match.id);
          return;
        }
        // Create profile if not found
        const createRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.name || session.user.email.split("@")[0],
            avatarUrl: session.user.image || undefined,
            bio: "",
          }),
        });
        const created = await createRes.json();
        if (created?.id) {
          setUserId(created.id);
        }
      } catch (e) {
        console.error("User sync failed", e);
      } finally {
        setLoading(false);
      }
    };
    syncUser();
  }, [session?.user?.email, session?.user?.name, session?.user?.image]);

  return { userId, loading };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { userId, loading: userLoading } = useAppUserId();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bearer = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null), []);

  const loadSpaces = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spaces", {
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load spaces");
      setSpaces(data);
    } catch (e: any) {
      setError(e.message || "Failed to load spaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadSpaces();
  }, [userId]);

  const handleSignOut = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      await authClient.signOut({
        fetchOptions: {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      });
      if (typeof window !== "undefined") localStorage.removeItem("bearer_token");
      router.push("/sign-in");
    } catch (e) {
      console.error(e);
    }
  };

  if (isPending || userLoading) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!session?.user) {
    // Middleware should redirect, but guard just in case
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Welcome</p>
              <h1 className="text-base font-semibold">{session.user.name || session.user.email}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => loadSpaces()} disabled={loading}>
              Refresh
            </Button>
            <Button variant="secondary" asChild>
              <a href="/lessons">Lessons</a>
            </Button>
            <CreateSpaceDialog onCreated={loadSpaces} userId={userId!} bearer={bearer} />
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Your spaces</h2>
          <p className="text-sm text-muted-foreground">Collaborate with your groups</p>
        </section>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="grid place-items-center rounded-xl border p-10 text-center">
            <div className="mx-auto mb-3 h-24 w-full max-w-md rounded-xl bg-[url('https://images.unsplash.com/photo-1529336953121-c821fd84a2a3?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
            <h3 className="text-base font-medium">No spaces yet</h3>
            <p className="text-sm text-muted-foreground">Create your first space to start collaborating.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <Card
                key={space.id}
                className="overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => router.push(`/spaces/${space.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/spaces/${space.id}`)
                }}
              >
                <div
                  className="h-24 w-full bg-muted"
                  style={{
                    backgroundImage: `url(${space.coverImageUrl || "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <CardHeader>
                  <CardTitle className="text-base">{space.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{space.description || ""}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Role: {space.userRole}</span>
                    <span>Updated {new Date(space.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CreateSpaceDialog({ onCreated, userId, bearer }: { onCreated: () => void; userId: number; bearer: string | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSpace = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({
          name,
          description,
          coverImageUrl: coverImageUrl || undefined,
          themeColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create space");
      setOpen(false);
      setName("");
      setDescription("");
      setCoverImageUrl("");
      setThemeColor("#3B82F6");
      onCreated();
    } catch (e: any) {
      setError(e.message || "Failed to create space");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create space</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new space</DialogTitle>
          <DialogDescription>Give your space a name and optional details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="space-name">Name</Label>
            <Input id="space-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Product Dev Hub" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="space-desc">Description</Label>
            <Input id="space-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this space about?" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="space-cover">Cover image URL (optional)</Label>
            <Input id="space-cover" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="space-color">Theme color</Label>
            <Input id="space-color" type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={createSpace} disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
