"use client"

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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

function YouTubeEmbed({ url }: { url: string }) {
  try {
    const u = new URL(url);
    const id = u.searchParams.get("v") || url.split("/").pop();
    const src = `https://www.youtube.com/embed/${id}`;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md border">
        <iframe className="h-full w-full" src={src} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube video" />
      </div>
    );
  } catch {
    return null;
  }
}

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = Number(params?.id);
  const { data: session, isPending } = useSession();
  const { userId, loading } = useAppUserId();
  const bearer = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null), []);

  const [lesson, setLesson] = useState<any | null>(null);
  const [progressRows, setProgressRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || Number.isNaN(lessonId)) return;
    setError(null);
    try {
      const [lessonRes, progRes] = await Promise.all([
        fetch(`/api/lessons?id=${lessonId}`, { headers: { "Content-Type": "application/json", Authorization: bearer ? `Bearer ${bearer}` : "", "x-user-id": String(userId) } }),
        fetch(`/api/progress?lessonId=${lessonId}`, { headers: { "Content-Type": "application/json", Authorization: bearer ? `Bearer ${bearer}` : "", "x-user-id": String(userId) } }),
      ]);
      const lessonData = await lessonRes.json();
      const progData = await progRes.json();
      if (!lessonRes.ok) throw new Error(lessonData?.error || "Failed to load lesson");
      if (!progRes.ok) throw new Error(progData?.error || "Failed to load progress");
      setLesson(lessonData);
      setProgressRows(progData);
    } catch (e: any) {
      setError(e.message || "Failed to load lesson");
    }
  }, [lessonId, userId, bearer]);

  useEffect(() => { load(); }, [load]);

  const setTopicStatus = async (topicId: number, status: "not_started" | "in_progress" | "completed") => {
    try {
      const res = await fetch(`/api/progress`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: bearer ? `Bearer ${bearer}` : "", "x-user-id": String(userId) }, body: JSON.stringify({ lessonId, topicId, status }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update progress");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to update progress");
    }
  };

  const getTopicStatus = (topicId: number) => progressRows.find((p) => p.topicId === topicId)?.status || "not_started";

  if (Number.isNaN(lessonId)) return <div className="min-h-dvh grid place-items-center p-6"><p className="text-sm text-red-600">Invalid lesson ID</p></div>;
  if (isPending || loading) return <div className="min-h-dvh grid place-items-center p-6"><p className="text-sm text-muted-foreground">Loading lesson...</p></div>;
  if (!session?.user) { router.push("/sign-in"); return null; }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Lesson</p>
              <h1 className="text-base font-semibold">{lesson?.title || `#${lessonId}`}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/lessons">Back</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!lesson ? (
          <div className="h-40 animate-pulse rounded-md border bg-card" />
        ) : (
          <div className="grid gap-6">
            <Card>
              <div className="h-40 w-full bg-muted" style={{ backgroundImage: `url(${lesson.coverImageUrl || "https://images.unsplash.com/photo-1496307653780-42ee777d4833?q=80&w=1200&auto=format&fit=crop"})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <CardHeader>
                <CardTitle>{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{lesson.description || ""}</p>
                <p className="mt-2 text-xs text-muted-foreground">Availability: {lesson.availability}{lesson.availableAt ? ` • from ${new Date(lesson.availableAt).toLocaleDateString()}` : ""}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {lesson.topics?.map((t: any) => (
                <Card key={t.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{t.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {t.youtubeUrl ? <YouTubeEmbed url={t.youtubeUrl} /> : null}
                    <p className="text-sm whitespace-pre-wrap">{t.body}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setTopicStatus(t.id, "in_progress")}>In progress</Button>
                      <Button size="sm" onClick={() => setTopicStatus(t.id, "completed")}>Mark completed</Button>
                      <span className="text-xs text-muted-foreground">Status: {getTopicStatus(t.id)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
