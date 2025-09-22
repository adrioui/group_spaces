"use client"

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtime } from "@/hooks/useRealtime";
import { type RealtimeEvent } from "@/lib/realtime";

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
        const res = await fetch("/api/users", { headers: { "Content-Type": "application/json" } });
        const list = await res.json();
        const match = Array.isArray(list)
          ? list.find((u: any) => u.email?.toLowerCase() === session.user.email.toLowerCase())
          : null;
        if (match) {
          setUserId(match.id);
          return;
        }
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
        if (created?.id) setUserId(created.id);
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

export default function SpacePage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = Number(params?.id);
  const { data: session, isPending } = useSession();
  const { userId, loading: userLoading } = useAppUserId();
  const bearer = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null), []);

  const [tab, setTab] = useState("chat");

  if (Number.isNaN(spaceId)) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <p className="text-sm text-red-600">Invalid space ID</p>
      </div>
    );
  }

  if (isPending || userLoading) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <p className="text-sm text-muted-foreground">Loading space...</p>
      </div>
    );
  }

  if (!session?.user) {
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
              <p className="text-sm text-muted-foreground">Space</p>
              <h1 className="text-base font-semibold">#{spaceId}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>Back</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <ChatPanel spaceId={spaceId} userId={userId!} bearer={bearer} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <NotesPanel spaceId={spaceId} userId={userId!} bearer={bearer} />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <MembersPanel spaceId={spaceId} userId={userId!} bearer={bearer} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <SettingsPanel spaceId={spaceId} userId={userId!} bearer={bearer} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ChatPanel({ spaceId, userId, bearer }: { spaceId: number; userId: number; bearer: string | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/messages?spaceId=${spaceId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load messages");
      setMessages(data);
    } catch (e: any) {
      setError(e.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [spaceId, userId, bearer]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(spaceId, (event: RealtimeEvent) => {
    if (event.type === 'message:new') {
      setMessages(prev => [event.payload, ...prev]);
    }
  }, [spaceId]);

  const send = async () => {
    if (!content.trim()) return;
    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ spaceId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      setContent("");
      setMessages((prev) => [data, ...prev]);
    } catch (e: any) {
      setError(e.message || "Failed to send message");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="h-64 animate-pulse rounded-md border bg-card" />
        ) : (
          <div className="grid gap-3">
            <div className="border rounded-md">
              <ScrollArea className="h-64">
                <div className="flex flex-col-reverse p-3 gap-3">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{m.user?.name || "Unknown"}</span>
                        <span>{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm">{m.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button onClick={send} disabled={!content.trim()}>Send</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotesPanel({ spaceId, userId, bearer }: { spaceId: number; userId: number; bearer: string | null }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [notesRes, membersRes] = await Promise.all([
        fetch(`/api/notes?spaceId=${spaceId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer ? `Bearer ${bearer}` : "",
            "x-user-id": String(userId),
          },
        }),
        fetch(`/api/members?spaceId=${spaceId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer ? `Bearer ${bearer}` : "",
            "x-user-id": String(userId),
          },
        }),
      ]);
      const data = await notesRes.json();
      const membersData = await membersRes.json();
      if (!notesRes.ok) throw new Error(data?.error || "Failed to load notes");
      if (!membersRes.ok) throw new Error(membersData?.error || "Failed to load members");
      setNotes(data);
      setMembers(membersData);
    } catch (e: any) {
      setError(e.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [spaceId, userId, bearer]);

  useEffect(() => {
    load();
  }, []);

  useRealtime(spaceId, (event: RealtimeEvent) => {
    if (event.type === 'note:created' || event.type === 'note:updated') {
      setNotes(prev => {
        const existingIndex = prev.findIndex(n => n.id === event.payload.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = event.payload;
          return updated;
        }
        return [event.payload, ...prev];
      });
    } else if (event.type === 'note:deleted') {
      setNotes(prev => prev.filter(n => n.id !== event.payload.id));
    }
  }, [spaceId]);

  const save = async () => {
    if (!title.trim()) return;
    try {
      const res = await fetch(`/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ spaceId, title, status: "draft", assignedTo: assignedTo ? Number(assignedTo) : undefined, dueAt: dueAt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save note");
      setTitle("");
      setAssignedTo("");
      setDueAt("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to save note");
    }
  };

  const deleteNote = async (id: number) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
      });
      if (!res.ok) throw new Error("Failed to delete note");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to delete note");
    }
  };

  const publishNote = async (id: number) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ status: "published" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to publish note");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to publish note");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="h-40 animate-pulse rounded-md border bg-card" />
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      save();
                    }
                  }}
                />
              </div>
              <div>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assign member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {members.map((m) => (
                        <SelectItem key={`assignee-${m.userId}`} value={String(m.userId)}>
                          {m.userName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <Button onClick={save} disabled={!title.trim()}>Create</Button>
              </div>
            </div>
            <div className="grid gap-2">
              {notes.map((n) => (
                <div key={n.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{n.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Status: {n.status}
                        {n.assignedTo ? ` • Assigned to #${n.assignedTo}` : ""}
                        {n.dueAt ? ` • Due ${new Date(n.dueAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {n.status !== "published" && (
                        <Button variant="secondary" size="sm" onClick={() => publishNote(n.id)}>Publish</Button>
                      )}
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/notes/${n.id}`}>Open</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteNote(n.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MembersPanel({ spaceId, userId, bearer }: { spaceId: number; userId: number; bearer: string | null }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/members?spaceId=${spaceId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load members");
      setMembers(data);
    } catch (e: any) {
      setError(e.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useRealtime(spaceId, (event: RealtimeEvent) => {
    if (event.type === 'member:joined' || event.type === 'member:left') {
      load();
    }
  }, [spaceId, load]);

  const invite = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ spaceId, email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to invite member");
      setEmail("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to invite member");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="h-40 animate-pulse rounded-md border bg-card" />
        ) : (
          <div className="grid gap-4">
            <div className="flex gap-2 items-end">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="invite-email">Invite by email</Label>
                <Input id="invite-email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2 w-32">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={invite} disabled={!email}>Invite</Button>
            </div>
            <div className="grid gap-2">
              {members.map((m) => (
                <div key={m.membershipId} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <p className="text-sm font-medium">{m.userName}</p>
                    <p className="text-xs text-muted-foreground">{m.userEmail} • {m.role} • {m.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsPanel({ spaceId, userId, bearer }: { spaceId: number; userId: number; bearer: string | null }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const save = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/spaces?id=${spaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ name: name || undefined, description, coverImageUrl: coverImageUrl || undefined, themeColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update space");
      setSuccess("Space updated successfully");
    } catch (e: any) {
      setError(e.message || "Failed to update space");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{success}</div>}
        <div className="grid gap-2">
          <Label htmlFor="space-name">Name</Label>
          <Input id="space-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Update space name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="space-desc">Description</Label>
          <Input id="space-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Update description" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="space-cover">Cover image URL</Label>
          <Input id="space-cover" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="space-color">Theme color</Label>
          <Input id="space-color" type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
