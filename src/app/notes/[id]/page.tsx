"use client"

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function NoteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = Number(params?.id);
  const { data: session, isPending } = useSession();
  const { userId, loading: userLoading } = useAppUserId();
  const bearer = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null), []);

  const [note, setNote] = useState<any | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New block form
  const [newType, setNewType] = useState<string>("");
  const [textValue, setTextValue] = useState("");
  const [todoText, setTodoText] = useState("");
  const [todoCompleted, setTodoCompleted] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const load = useCallback(async () => {
    if (!userId || Number.isNaN(noteId)) return;
    setError(null);
    setLoading(true);
    try {
      const [noteRes, blocksRes] = await Promise.all([
        fetch(`/api/notes?id=${noteId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer ? `Bearer ${bearer}` : "",
            "x-user-id": String(userId),
          },
        }),
        fetch(`/api/note-blocks?noteId=${noteId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: bearer ? `Bearer ${bearer}` : "",
            "x-user-id": String(userId),
          },
        }),
      ]);
      const noteData = await noteRes.json();
      const blocksData = await blocksRes.json();
      if (!noteRes.ok) throw new Error(noteData?.error || "Failed to load note");
      if (!blocksRes.ok) throw new Error(blocksData?.error || "Failed to load blocks");
      setNote(noteData);
      setBlocks(blocksData);
    } catch (e: any) {
      setError(e.message || "Failed to load note");
    } finally {
      setLoading(false);
    }
  }, [noteId, userId, bearer]);

  useEffect(() => {
    load();
  }, [load]);

  if (Number.isNaN(noteId)) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <p className="text-sm text-red-600">Invalid note ID</p>
      </div>
    );
  }

  if (isPending || userLoading) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <p className="text-sm text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/sign-in");
    return null;
  }

  const addBlock = async () => {
    try {
      let content: any = {};
      if (newType === "text") {
        if (!textValue.trim()) return;
        content = { text: textValue };
      } else if (newType === "todo") {
        if (!todoText.trim()) return;
        content = { text: todoText, completed: todoCompleted };
      } else if (newType === "link") {
        if (!linkUrl.trim()) return;
        content = { url: linkUrl, title: linkTitle || linkUrl };
      } else {
        return;
      }
      const res = await fetch(`/api/note-blocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ noteId, type: newType, content, position: blocks.length + 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add block");
      // reset
      setNewType("");
      setTextValue("");
      setTodoText("");
      setTodoCompleted(false);
      setLinkUrl("");
      setLinkTitle("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to add block");
    }
  };

  const updateBlock = async (id: number, updates: any) => {
    try {
      const res = await fetch(`/api/note-blocks?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update block");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to update block");
    }
  };

  const deleteBlock = async (id: number) => {
    try {
      const res = await fetch(`/api/note-blocks?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
      });
      if (!res.ok) throw new Error("Failed to delete block");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to delete block");
    }
  };

  const moveBlock = async (id: number, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    // recompute positions starting from 1
    const payload = reordered.map((b, i) => ({ id: b.id, position: i + 1 }));
    try {
      const res = await fetch(`/api/note-blocks/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer ? `Bearer ${bearer}` : "",
          "x-user-id": String(userId),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to reorder blocks");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to reorder blocks");
    }
  };

  const publishNote = async () => {
    try {
      const res = await fetch(`/api/notes?id=${noteId}`, {
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
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Note</p>
              <h1 className="text-base font-semibold">{note ? note.title : `#${noteId}`}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/spaces/${note?.spaceId || ""}`}>Back to space</Link>
            </Button>
            {note?.status !== "published" && (
              <Button onClick={publishNote}>Publish</Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="h-40 animate-pulse rounded-md border bg-card" />
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[60vh]">
                  <div className="grid gap-3">
                    {blocks.map((b) => {
                      const content = typeof b.content === "string" ? JSON.parse(b.content) : b.content;
                      return (
                        <div key={b.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{b.type}</p>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => moveBlock(b.id, "up")}>Up</Button>
                              <Button size="sm" variant="outline" onClick={() => moveBlock(b.id, "down")}>Down</Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteBlock(b.id)}>Delete</Button>
                            </div>
                          </div>
                          {b.type === "text" && (
                            <div className="mt-2 grid gap-2">
                              <Label htmlFor={`text-${b.id}`}>Text</Label>
                              <Input
                                id={`text-${b.id}`}
                                value={content?.text || ""}
                                onChange={(e) => updateBlock(b.id, { content: { text: e.target.value } })}
                                placeholder="Write text..."
                              />
                            </div>
                          )}
                          {b.type === "todo" && (
                            <div className="mt-2 grid gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  id={`todo-completed-${b.id}`}
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={!!content?.completed}
                                  onChange={(e) => updateBlock(b.id, { content: { text: content?.text || "", completed: e.target.checked } })}
                                />
                                <Label htmlFor={`todo-completed-${b.id}`}>Completed</Label>
                              </div>
                              <Label htmlFor={`todo-text-${b.id}`}>Task</Label>
                              <Input
                                id={`todo-text-${b.id}`}
                                value={content?.text || ""}
                                onChange={(e) => updateBlock(b.id, { content: { text: e.target.value, completed: !!content?.completed } })}
                                placeholder="Describe the task..."
                              />
                            </div>
                          )}
                          {b.type === "link" && (
                            <div className="mt-2 grid gap-2">
                              <Label htmlFor={`link-url-${b.id}`}>URL</Label>
                              <Input
                                id={`link-url-${b.id}`}
                                value={content?.url || ""}
                                onChange={(e) => updateBlock(b.id, { content: { url: e.target.value, title: content?.title || e.target.value } })}
                                placeholder="https://..."
                              />
                              <Label htmlFor={`link-title-${b.id}`}>Title</Label>
                              <Input
                                id={`link-title-${b.id}`}
                                value={content?.title || ""}
                                onChange={(e) => updateBlock(b.id, { content: { url: content?.url || "", title: e.target.value } })}
                                placeholder="Link title"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add block</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Block type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {newType === "text" && (
                  <div className="grid gap-2">
                    <Label htmlFor="new-text">Text</Label>
                    <Input id="new-text" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Write text..." />
                  </div>
                )}
                {newType === "todo" && (
                  <div className="grid gap-2">
                    <Label htmlFor="new-todo-text">Task</Label>
                    <Input id="new-todo-text" value={todoText} onChange={(e) => setTodoText(e.target.value)} placeholder="Describe the task..." />
                    <div className="flex items-center gap-2">
                      <input id="new-todo-completed" type="checkbox" className="h-4 w-4" checked={todoCompleted} onChange={(e) => setTodoCompleted(e.target.checked)} />
                      <Label htmlFor="new-todo-completed">Completed</Label>
                    </div>
                  </div>
                )}
                {newType === "link" && (
                  <div className="grid gap-2">
                    <Label htmlFor="new-link-url">URL</Label>
                    <Input id="new-link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
                    <Label htmlFor="new-link-title">Title</Label>
                    <Input id="new-link-title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Link title" />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={addBlock} disabled={!newType}>Add block</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
