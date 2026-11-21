"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CampaignPanel({
  topics,
  campaigns,
}: {
  topics: { id: string; title: string; slug: string }[];
  campaigns: {
    id: string;
    title: string;
    status: string;
    body: string;
  }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topicId, setTopicId] = useState(topics[0]?.id || "");
  const [channel, setChannel] = useState("test");
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<{ count: number } | null>(null);

  function create() {
    if (!topicId) return;
    start(async () => {
      await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, topicId, channel }),
      });
      setTitle("");
      setBody("");
      router.refresh();
    });
  }

  function doPreview(id: string) {
    start(async () => {
      const res = await fetch(`/api/admin/campaigns/${id}/preview`, {
        method: "POST",
      });
      const data = await res.json();
      setPreview({ count: data.count || 0 });
      router.refresh();
    });
  }

  function launch(id: string) {
    start(async () => {
      await fetch(`/api/admin/campaigns/${id}/launch`, { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-5">
        <h2 className="font-semibold">Новая кампания</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="field"
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="field"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="test">test</option>
            <option value="telegram">telegram</option>
            <option value="max">max</option>
            <option value="whatsapp">whatsapp</option>
          </select>
          <textarea
            className="field md:col-span-2"
            placeholder="Текст"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <button className="btn-primary mt-3" disabled={pending} onClick={create}>
          Сохранить черновик
        </button>
      </div>

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-ink/60">{c.status}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost"
                  disabled={pending}
                  onClick={() => doPreview(c.id)}
                >
                  Предпросмотр
                </button>
                <button
                  className="btn-primary"
                  disabled={pending || c.status === "running"}
                  onClick={() => launch(c.id)}
                >
                  Запустить
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-ink/80">{c.body}</p>
          </div>
        ))}
      </div>
      {preview && (
        <p className="text-sm text-ink/70">
          Получателей в очереди: {preview.count}
        </p>
      )}
    </div>
  );
}
