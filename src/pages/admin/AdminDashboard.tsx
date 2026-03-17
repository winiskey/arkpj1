import { BarChart3, Users, FileText, Radio, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { useAdminData } from "./AdminDataContext";

export function AdminDashboard() {
  const { data, loading, error } = useAdminData();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-text3">加载中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-live/20 bg-live/10 px-6 py-4 text-live">
          {error ?? "数据加载失败"}
        </div>
      </div>
    );
  }

  const { publicContent, scoreSheets, aggregates, compliance } = data;
  const teams = publicContent.teams;
  const sheets = scoreSheets;
  const broadcast = publicContent.liveBroadcast;

  const finalSheets = sheets.filter((s) => s.status === "final" || s.status === "published");
  const draftSheets = sheets.filter((s) => s.status === "draft");
  const teamsWithIssues = compliance.filter((c) => c.blockingIssues.length > 0);
  const teamsReady = compliance.filter((c) => c.blockingIssues.length === 0);
  const publishedTeams = aggregates.filter((a) =>
    teams.find((t) => t.id === a.teamId && t.status === "published"),
  );

  const totalMembers = teams.reduce((s, t) => s + t.members.length, 0);
  const scoredMembers = aggregates.reduce((s, a) => s + a.scoredCount, 0);
  const finalizedMembers = aggregates.reduce((s, a) => s + a.finalizedCount, 0);
  const publishedMembers = aggregates.reduce((s, a) => s + a.publishedCount, 0);
  const scoreProgress = totalMembers > 0 ? Math.round((scoredMembers / totalMembers) * 100) : 0;
  const finalizeProgress = totalMembers > 0 ? Math.round((finalizedMembers / totalMembers) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-title text-3xl font-bold text-text1">仪表盘</h1>
        <p className="mt-1 text-sm text-text3">赛事管理总览</p>
      </div>

      {/* ── KPI Cards Grid ─────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="参赛战队" value={teams.length} sub={`${totalMembers} 名选手 · ${teamsReady.length} 就绪`} accent="brand" />
        <StatCard icon={FileText} label="已终审成绩单" value={finalSheets.length} sub={`${draftSheets.length} 草稿中 · 共 ${sheets.length} 份`} accent="brand" />
        <StatCard icon={BarChart3} label="已发布队伍" value={publishedTeams.length} sub={`共 ${teams.length} 队`} accent="brand" />
        <StatCard icon={Radio} label="直播状态" value={broadcast.status} sub={broadcast.title || "—"} accent={broadcast.status === "LIVE" ? "live" : "brand"} />
      </div>

      {/* ── Scoring Progress ────────────────────────────────────── */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
          <h3 className="mb-4 text-sm font-semibold text-text1">录分进度</h3>
          <ProgressRow label="已录分" current={scoredMembers} total={totalMembers} pct={scoreProgress} color="bg-brand" />
          <ProgressRow label="已终审" current={finalizedMembers} total={totalMembers} pct={finalizeProgress} color="bg-green-500" />
          <ProgressRow label="已发布" current={publishedMembers} total={totalMembers} pct={totalMembers > 0 ? Math.round((publishedMembers / totalMembers) * 100) : 0} color="bg-amber-500" />
        </div>
        <div className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
          <h3 className="mb-4 text-sm font-semibold text-text1">快捷操作</h3>
          <div className="flex flex-col gap-3">
            <QuickLink href="/admin/calculator" label="打开计分终端" desc="录入选手成绩数据" />
            <QuickLink href="/admin/scores" label="成绩管理" desc="审核/终审成绩单" />
            <QuickLink href="/admin/teams" label="战队管理" desc="设置合规参数并发布成绩" />
            <QuickLink href="/admin/broadcast" label="直播控制" desc="管理赛事直播信息" />
          </div>
        </div>
      </div>

      {/* ── Issues & Warnings ──────────────────────────────────── */}
      {teamsWithIssues.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text1">
            <AlertTriangle className="h-5 w-5 text-live" />
            合规阻塞问题
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {teamsWithIssues.map((c) => (
              <div key={c.teamId} className="rounded-xl border border-live/20 bg-live/5 p-4">
                <div className="mb-2 font-medium text-text1">{c.teamName}</div>
                <ul className="space-y-1">
                  {c.blockingIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-live">• {issue}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Team aggregates summary ────────────────────────────── */}
      {aggregates.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text1">
            <CheckCircle className="h-5 w-5 text-brand" />
            战队积分概览
          </h2>
          <div className="overflow-hidden rounded-xl border border-strokeSoft">
            <table className="w-full text-sm">
              <thead className="bg-surface2 text-text3">
                <tr>
                  <th className="px-4 py-3 text-left">战队</th>
                  <th className="px-4 py-3 text-right">录分</th>
                  <th className="px-4 py-3 text-right">原始分</th>
                  <th className="px-4 py-3 text-right">系数</th>
                  <th className="px-4 py-3 text-right">最终分</th>
                  <th className="px-4 py-3 text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-strokeSoft">
                {[...aggregates]
                  .sort((a, b) => b.finalTotal - a.finalTotal)
                  .map((agg) => (
                    <tr key={agg.teamId} className="bg-surface1 transition-colors hover:bg-surface2">
                      <td className="px-4 py-3 font-medium text-text1">
                        {agg.teamName}
                        {agg.teamTag && <span className="ml-2 text-xs text-text3">[{agg.teamTag}]</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-text3">
                        {agg.scoredCount}/{agg.memberCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text2">
                        {Math.round(agg.rawTotal).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text2">
                        ×{agg.coefficient.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-brand">
                        {Math.round(agg.finalTotal).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {agg.publishBlockingIssues.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-xs text-live">
                            <AlertTriangle className="h-3 w-3" />
                            {agg.publishBlockingIssues.length} 问题
                          </span>
                        ) : agg.publishReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            可发布
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                            <CheckCircle className="h-3 w-3" />
                            进行中
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "brand",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "brand" | "live";
}) {
  const accentClasses = accent === "live" ? "bg-live/10 text-live" : "bg-brand/10 text-brand";

  return (
    <div className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${accentClasses}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-3xl font-bold text-text1">{value}</div>
      <div className="mt-1 text-sm text-text3">{label}</div>
      {sub && <div className="mt-2 text-xs text-text3/70">{sub}</div>}
    </div>
  );
}

function ProgressRow({ label, current, total, pct, color }: {
  label: string; current: number; total: number; pct: number; color: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text2">{label}</span>
        <span className="font-mono text-text3">{current}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-surface3">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-lg border border-strokeSoft bg-surface3 px-4 py-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
    >
      <div>
        <div className="text-sm font-medium text-text1 group-hover:text-brand">{label}</div>
        <div className="text-xs text-text3">{desc}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-text3 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
    </a>
  );
}
