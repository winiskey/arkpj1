import { useState } from "react";
import { FileText, ArrowUpCircle, CheckCircle, Clock } from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import { patchScoreSheetStatus } from "./useAdminApi";
import type { ScoreSheetSummary, ThemeCode } from "./types";

const THEME_LABELS: Record<ThemeCode, string> = {
  sami: "探索者的银淞止境",
  sarkaz: "萨卡兹的无终奇语",
  sui: "岁的界园志异",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "text-text3" },
  final: { label: "终审", color: "text-brand" },
  published: { label: "已发布", color: "text-green-400" },
};

export function ScoreManagement() {
  const { data, loading, error, refresh } = useAdminData();
  const [filterTeam, setFilterTeam] = useState("");
  const [filterTheme, setFilterTheme] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (loading) return <div className="p-8 text-text3">加载中...</div>;
  if (error || !data) return <div className="p-8 text-live">{error ?? "数据加载失败"}</div>;

  const { publicContent, scoreSheets } = data;
  const teams = publicContent.teams;
  const sheets = scoreSheets;

  // Apply filters
  let filtered = [...sheets];
  if (filterTeam) filtered = filtered.filter((s) => s.teamId === filterTeam);
  if (filterTheme) filtered = filtered.filter((s) => s.theme === filterTheme);
  if (filterStatus) filtered = filtered.filter((s) => s.status === filterStatus);

  // Sort: newest first
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleStatusChange = async (sheet: ScoreSheetSummary, newStatus: string) => {
    setUpdating(sheet.id);
    setMsg(null);
    try {
      await patchScoreSheetStatus(sheet.id, newStatus);
      await refresh();
      setMsg({ type: "ok", text: `成绩单已更新为「${STATUS_LABELS[newStatus]?.label}」` });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "操作失败" });
    } finally {
      setUpdating(null);
    }
  };

  const getTeamName = (teamId: string) =>
    teams.find((t) => t.id === teamId)?.name ?? teamId;

  const getMemberName = (teamId: string, memberId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.members.find((m) => m.id === memberId)?.name ?? memberId;
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold text-text1">成绩管理</h1>
          <p className="mt-1 text-sm text-text3">
            共 {sheets.length} 份成绩单 · {sheets.filter((s) => s.status === "final").length} 已终审 · {sheets.filter((s) => s.status === "draft").length} 草稿
          </p>
        </div>

        {/* Tip: link to embedded calculator for score entry */}
        <a
          href="/admin/calculator"
          className="flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/20"
        >
          <FileText className="h-4 w-4" />
          打开计分终端录入成绩
        </a>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-text2">
        <strong className="text-brand">💡 工作流程：</strong>在「计分终端」中录入选手的详细成绩数据并提交
        → 成绩单会出现在本页面 → 审核后将成绩单状态从「草稿」提升为「终审」→ 最后在「战队管理」页发布整队成绩。
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${msg.type === "ok" ? "border-brand/20 bg-brand/10 text-brand" : "border-live/20 bg-live/10 text-live"
          }`}>
          {msg.text}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          aria-label="按战队筛选"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="rounded-lg border border-strokeSoft bg-surface3 px-3 py-2 text-sm text-text1 focus:border-brand focus:outline-none"
        >
          <option value="">全部战队</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          aria-label="按主题筛选"
          value={filterTheme}
          onChange={(e) => setFilterTheme(e.target.value)}
          className="rounded-lg border border-strokeSoft bg-surface3 px-3 py-2 text-sm text-text1 focus:border-brand focus:outline-none"
        >
          <option value="">全部主题</option>
          <option value="sami">萨米</option>
          <option value="sarkaz">萨卡兹</option>
          <option value="sui">岁</option>
        </select>

        <select
          aria-label="按状态筛选"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-strokeSoft bg-surface3 px-3 py-2 text-sm text-text1 focus:border-brand focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="final">终审</option>
          <option value="published">已发布</option>
        </select>
      </div>

      {/* ── Score Sheets Table ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-strokeSoft bg-surface2 p-12 text-center text-text3">
          <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>暂无成绩单{filterTeam || filterTheme || filterStatus ? "（当前筛选条件下）" : ""}</p>
          <p className="mt-2 text-xs">前往「计分终端」录入成绩</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-strokeSoft">
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text3">
              <tr>
                <th className="px-4 py-3 text-left">战队 / 选手</th>
                <th className="px-4 py-3 text-left">主题</th>
                <th className="px-4 py-3 text-right">预览分</th>
                <th className="px-4 py-3 text-left">公式</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3 text-center">更新时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-strokeSoft">
              {filtered.map((sheet) => {
                const statusInfo = STATUS_LABELS[sheet.status] ?? STATUS_LABELS.draft;
                const isUpdating = updating === sheet.id;

                return (
                  <tr key={sheet.id} className="bg-surface1 transition-colors hover:bg-surface2">
                    {/* Team / Member */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-text1">{getTeamName(sheet.teamId)}</div>
                      <div className="text-xs text-text3">{getMemberName(sheet.teamId, sheet.memberId)}</div>
                    </td>

                    {/* Theme */}
                    <td className="px-4 py-3 text-text2">
                      {THEME_LABELS[sheet.theme as ThemeCode] ?? sheet.theme}
                    </td>

                    {/* Preview Score */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-brand">
                      {Math.round(sheet.previewScore).toLocaleString()}
                    </td>

                    {/* Formula */}
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-text3">
                      {sheet.formulaText || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}>
                        {sheet.status === "draft" && <Clock className="h-3 w-3" />}
                        {sheet.status === "final" && <CheckCircle className="h-3 w-3" />}
                        {sheet.status === "published" && <ArrowUpCircle className="h-3 w-3" />}
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-center text-xs text-text3">
                      {new Date(sheet.updatedAt).toLocaleString("zh-CN", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {sheet.status === "draft" && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(sheet, "final")}
                            className="rounded-md bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
                            title="终审确认"
                          >
                            {isUpdating ? "..." : "终审"}
                          </button>
                        )}
                        {sheet.status === "final" && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(sheet, "draft")}
                            className="rounded-md bg-live/10 px-3 py-1.5 text-xs font-medium text-live transition-colors hover:bg-live/20 disabled:opacity-50"
                            title="退回草稿"
                          >
                            {isUpdating ? "..." : "退回"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
