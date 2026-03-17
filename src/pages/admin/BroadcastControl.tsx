import { useState, type FormEvent } from "react";
import { Radio } from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import { patchLiveBroadcast } from "./useAdminApi";
import type { BroadcastStatus } from "./types";

const STATUS_OPTIONS: { value: BroadcastStatus; label: string }[] = [
  { value: "LIVE", label: "直播中" },
  { value: "UPCOMING", label: "即将开始" },
  { value: "OFFLINE", label: "已结束" },
];

export function BroadcastControl() {
  const { data, loading, error, refresh } = useAdminData();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [formStatus, setFormStatus] = useState<BroadcastStatus>("OFFLINE");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formHref, setFormHref] = useState("");
  const [formRoomLabel, setFormRoomLabel] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Hydrate form from fetched data (once)
  if (data && !initialized) {
    const b = data.publicContent.liveBroadcast;
    setFormStatus(b.status);
    setFormTitle(b.title);
    setFormSubtitle(b.subtitle);
    setFormHref(b.href);
    setFormRoomLabel(b.roomLabel);
    setFormNotice(b.notice);
    setInitialized(true);
  }

  if (loading) {
    return <div className="p-8 text-text3">加载中...</div>;
  }
  if (error) {
    return <div className="p-8 text-live">{error}</div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await patchLiveBroadcast({
        status: formStatus,
        title: formTitle,
        subtitle: formSubtitle,
        href: formHref,
        roomLabel: formRoomLabel,
        notice: formNotice,
      });
      await refresh();
      setSaveMsg({ type: "ok", text: "已同步到前端，刷新首页可预览效果" });
    } catch (err) {
      setSaveMsg({ type: "err", text: err instanceof Error ? err.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-8 font-title text-3xl font-bold text-text1">直播控制</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-live/10">
            <Radio className="h-6 w-6 text-live" />
          </div>
          <div>
            <h2 className="font-semibold text-text1">推流状态</h2>
            <p className="text-sm text-text3">下方信息将实时同步至前端首页的直播入口卡片</p>
          </div>
        </div>

        {/* Status select */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text2">状态</label>
          <select
            title="直播状态"
            aria-label="直播状态"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as BroadcastStatus)}
            className="w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text2">标题</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none"
            placeholder="例：荆楚歌 #2 决赛日直播"
          />
        </div>

        {/* Subtitle */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text2">副标题</label>
          <input
            type="text"
            value={formSubtitle}
            onChange={(e) => setFormSubtitle(e.target.value)}
            className="w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none"
            placeholder="例：A组 vs B组 半决赛"
          />
        </div>

        {/* URL */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text2">直播链接</label>
          <input
            type="url"
            value={formHref}
            onChange={(e) => setFormHref(e.target.value)}
            className="w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none"
            placeholder="例：https://live.bilibili.com/123456"
          />
        </div>

        {/* Room Label */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text2">平台标签</label>
          <input
            type="text"
            title="平台标签"
            aria-label="平台标签"
            placeholder="例：直播间名称或ID"
            value={formRoomLabel}
            onChange={(e) => setFormRoomLabel(e.target.value)}
            className="w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none"
          />
        </div>

        {/* Notice */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text2">首页横幅公告</label>
          <textarea
            title="首页横幅公告"
            aria-label="首页横幅公告"
            placeholder="输入可以在首页轮播展示的公告信息…"
            value={formNotice}
            onChange={(e) => setFormNotice(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 text-text1 focus:border-brand focus:outline-none"
          />
        </div>

        {/* Status feedback */}
        {saveMsg && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${saveMsg.type === "ok"
              ? "border-brand/20 bg-brand/10 text-brand"
              : "border-live/20 bg-live/10 text-live"
              }`}
          >
            {saveMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand px-4 py-3 font-medium text-canvas transition-all hover:bg-brandStrong disabled:opacity-50"
        >
          {saving ? "同步中…" : "保存并同步到前端"}
        </button>
      </form>
    </div>
  );
}
