import { useMemo, useState } from "react";
import {
  CheckCircle, XCircle, AlertTriangle, ShieldAlert,
  Users, PhoneCall, ScrollText, Clock, Coins, UploadCloud, Trash2
} from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import {
  publishTeam, patchCompliance, addOperatorDraft,
  deleteOperatorDraft, addCoachCall, deleteCoachCall,
  addPlannedPick, deletePlannedPick
} from "./useAdminApi";
import { OperatorAvatar, OperatorCombobox } from "./OperatorCombobox";
import { findOperatorCatalogEntry, normalizeOperatorName } from "./operatorCatalog";
import type { Team, ComplianceSummary, TeamAggregate, OperatorCatalogEntry } from "./types";
import { useToast } from "./ToastContext";

export function TeamManagement() {
  const { data, loading, error, refresh } = useAdminData();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  if (loading) return <div className="p-8 text-text3">加载中...</div>;
  if (error || !data) return <div className="p-8 text-live">{error ?? "加载失败"}</div>;

  const { publicContent, compliance: complianceSummaries, aggregates: teamAggregates } = data;
  const teams = publicContent.teams;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold text-text1">战队管理</h1>
          <p className="mt-1 text-sm text-text3">
            共 {teams.length} 支队伍 · {teams.filter(t => t.status !== "PENDING").length} 支已发布成绩
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {teams.map((team) => {
          const compliance = complianceSummaries.find(cs => cs.teamId === team.id);
          const aggregate = teamAggregates.find(ta => ta.teamId === team.id);
          const isExpanded = expandedTeamId === team.id;

          return (
            <div key={team.id} className="overflow-hidden rounded-2xl border border-strokeSoft bg-surface2 shadow-panel">
              {/* Header / Summary row */}
              <div
                className="flex cursor-pointer items-center justify-between bg-surface2 p-6 transition-colors hover:bg-surface3"
                onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-text1">{team.name}</h3>
                    <span className="rounded bg-surface3 px-2 py-0.5 text-xs text-text3">
                      {team.id}
                    </span>
                    {team.sample && (
                      <span className="rounded border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs text-brand">样本队伍</span>
                    )}
                  </div>
                  {aggregate && (
                    <div className="mt-1.5 flex items-center gap-4 text-sm">
                      <span className="text-text2">基础总分: {aggregate.rawTotal.toFixed(1)}</span>
                      <span className="text-text2">合规系数: {(aggregate.coefficient * 100).toFixed(1)}%</span>
                      <span className="font-bold text-brand">最终得分: {aggregate.finalTotal.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {/* Status Indicator */}
                  {aggregate && aggregate.publishBlockingIssues.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm text-live">
                      <ShieldAlert className="h-4 w-4" /> 有 {aggregate.publishBlockingIssues.length} 项必须解决的问题
                    </span>
                  ) : aggregate && aggregate.warnings.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm text-brand">
                      <AlertTriangle className="h-4 w-4" /> 有 {aggregate.warnings.length} 项提醒
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle className="h-4 w-4" /> 可以发布
                    </span>
                  )}

                  {/* Publish Status */}
                  <div className="flex w-24 items-center justify-end">
                    {team.status !== "PENDING" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                        <CheckCircle className="h-3 w-3" /> 已发布
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-surface3 px-2 py-1 text-xs font-medium text-text3">
                        <Clock className="h-3 w-3" /> 待发布
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail Panel */}
              {isExpanded && compliance && aggregate && (
                <div className="border-t border-strokeSoft bg-surface1 p-6">
                  <TeamCompliancePanel
                    team={team}
                    compliance={compliance}
                    aggregate={aggregate}
                    refresh={refresh}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compliance Panel Sub-component ─────────────────────────────────

function TeamCompliancePanel({
  team,
  compliance,
  aggregate,
  refresh
}: {
  team: Team;
  compliance: ComplianceSummary;
  aggregate: TeamAggregate;
  refresh: () => Promise<void>
}) {
  const [publishing, setPublishing] = useState(false);
  const toast = useToast();

  const handlePublish = async () => {
    if (!confirm(`将为「${team.name}」计算最终成绩并发布到前端排行榜，确定继续吗？`)) return;
    setPublishing(true);
    try {
      await publishTeam(team.id);
      await refresh();
      toast.success(`${team.name} 发布成功！`);
    } catch (e: any) {
      toast.error(`发布失败: ${e.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handlePatch = async (key: string, value: any) => {
    try {
      await patchCompliance(team.id, { [key]: value });
      await refresh();
    } catch (e: any) {
      toast.error(`保存失败: ${e.message}`);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* LEFT COLUMN: Settings & Forms */}
      <div className="lg:col-span-8">
        <h4 className="mb-4 text-sm font-semibold text-text1">合规参数</h4>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Card: Pressure Role & Overtime */}
          <div className="rounded-xl border border-strokeSoft bg-surface2 p-4">
            <div className="mb-4 flex items-center gap-2 font-medium text-brand">
              <Users className="h-4 w-4" /> 比赛基本参数
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-text2">抗压位选手</label>
              <select
                aria-label="抗压位选择"
                className="w-full rounded border border-strokeSoft bg-surface3 px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={compliance.roster.pressureMemberId ?? ""}
                onChange={(e) => handlePatch("pressureMemberId", e.target.value || null)}
              >
                <option value="">未指定抗压位</option>
                {team.members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-text2">全队总超时时长（分钟）</label>
              <input
                type="number"
                aria-label="赛事超时分钟数"
                className="w-full rounded border border-strokeSoft bg-surface3 px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={compliance.overtime.minutes}
                onChange={(e) => handlePatch("overtimeMinutes", parseInt(e.target.value) || 0)}
              />
              <div className="mt-1 text-[10px] text-text3">当前超时扣分系数：{compliance.coefficientBreakdown.overtime.delta * 100}%</div>
            </div>
          </div>

          {/* Card: Ingots */}
          <div className="rounded-xl border border-strokeSoft bg-surface2 p-4">
            <div className="mb-4 flex items-center gap-2 font-medium text-brand">
              <Coins className="h-4 w-4" /> 源石锭使用情况
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-text2">初始额度</label>
              <input
                type="number"
                aria-label="初始源石锭总额"
                className="w-full rounded border border-strokeSoft bg-surface3 px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={compliance.sharedIngots.openingIngots}
                onChange={(e) => handlePatch("openingIngots", parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-text2">赛后余额</label>
              <input
                type="number"
                aria-label="剩余源石锭总额"
                className="w-full rounded border border-strokeSoft bg-surface3 px-3 py-1.5 text-sm outline-none focus:border-brand"
                value={compliance.sharedIngots.currentIngots}
                onChange={(e) => handlePatch("currentIngots", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px]">
              <span className="text-text3">已消耗：{compliance.sharedIngots.spent}</span>
              <span className={compliance.sharedIngots.withinLimit ? "text-green-400" : "text-live"}>
                超额消费扣分系数: {compliance.coefficientBreakdown.extraShopSpend.delta * 100}%
              </span>
            </div>
          </div>

          {/* Card: Coach Calls */}
          <div className="rounded-xl border border-strokeSoft bg-surface2 p-4 md:col-span-2">
            <div className="mb-4 flex items-center gap-2 font-medium text-brand">
              <PhoneCall className="h-4 w-4" /> 教练连麦
            </div>

            <CoachCallManager team={team} compliance={compliance} refresh={refresh} />
          </div>

          {/* Card: Planned Picks */}
          <div className="rounded-xl border border-strokeSoft bg-surface2 p-4 md:col-span-2">
            <div className="mb-4 flex items-center gap-2 font-medium text-brand">
              <ScrollText className="h-4 w-4" /> 赛前公示计划（前端可见）
            </div>

            <PlannedPickManager team={team} refresh={refresh} />
          </div>

          {/* Card: Operator Drafts */}
          <div className="rounded-xl border border-strokeSoft bg-surface2 p-4 md:col-span-2">
            <div className="mb-4 flex items-center gap-2 font-medium text-brand">
              <ScrollText className="h-4 w-4" /> 实际持有干员（参与积分计算）
            </div>

            <OperatorDraftManager team={team} compliance={compliance} refresh={refresh} />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Validation & Publish Workflow */}
      <div className="lg:col-span-4">
        <h4 className="mb-4 text-sm font-semibold text-text1">发布检查</h4>

        <div className="mb-4 rounded-xl border border-strokeSoft bg-surface2 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text2">成绩预览</div>
          <div className="flex items-center justify-between border-b border-strokeSoft pb-2 text-sm">
            <span className="text-text2">基础总分:</span>
            <span className="font-mono text-text1">{aggregate.rawTotal.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-strokeSoft py-2 text-sm">
            <span className="text-text2">合规系数:</span>
            <span className="font-mono text-brand">{(aggregate.coefficient * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-base font-bold">
            <span className="text-text1">最终得分:</span>
            <span className="font-mono text-brand">{aggregate.finalTotal.toFixed(1)}</span>
          </div>
        </div>

        {aggregate.publishBlockingIssues.length > 0 && (
          <div className="mb-4 rounded-lg bg-live/10 p-4 border border-live/20">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-live">
              <ShieldAlert className="h-4 w-4" /> 🚫 以下问题阻止发布
            </div>
            <ul className="list-inside list-disc text-sm text-live/80 marker:text-live/50">
              {aggregate.publishBlockingIssues.map((iss, i) => (
                <li key={i}>{iss}</li>
              ))}
            </ul>
          </div>
        )}

        {aggregate.warnings.length > 0 && (
          <div className="mb-6 rounded-lg bg-brand/10 p-4 border border-brand/20">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand">
              <AlertTriangle className="h-4 w-4" /> ⚠ 提醒事项
            </div>
            <ul className="list-inside list-disc text-sm text-brand/80 marker:text-brand/50">
              {aggregate.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={aggregate.publishBlockingIssues.length > 0 || publishing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-medium text-canvas transition-colors hover:bg-brandStrong disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadCloud className="h-5 w-5" />
          {publishing ? "操作中..." : team.status === "PENDING" ? "确认发布到前端" : "重新计算并更新排行"}
        </button>
        <p className="mt-2 text-center text-xs text-text3">发布后成绩将立即更新至前端排行榜，观众可即时看到。</p>
      </div>
    </div>
  );
}

// ── Specialized Managers ───────────────────────────────────────────

function CoachCallManager({ team, compliance, refresh }: any) {
  const [caller, setCaller] = useState("");
  const [target, setTarget] = useState("");
  const [mins, setMins] = useState(0);
  const toast = useToast();

  const handleAdd = async () => {
    if (!caller || !target || mins <= 0) return;
    try {
      await addCoachCall(team.id, {
        requestedByMemberId: caller,
        targetMemberId: target,
        durationMinutes: mins
      });
      setMins(0);
      await refresh();
      toast.success("连麦记录已添加");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("确定删除连麦记录？")) return;
    try {
      await deleteCoachCall(team.id, id);
      await refresh();
      toast.success("连麦记录已删除");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="mb-3 flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-text3">发起方</label>
          <select aria-label="连麦申请人" value={caller} onChange={e => setCaller(e.target.value)} className="w-full rounded border border-strokeSoft bg-surface3 px-2 py-1 text-xs outline-none focus:border-brand">
            <option value="">选择选手</option>
            {team.members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-text3">接听方</label>
          <select aria-label="连麦目标选手" value={target} onChange={e => setTarget(e.target.value)} className="w-full rounded border border-strokeSoft bg-surface3 px-2 py-1 text-xs outline-none focus:border-brand">
            <option value="">选择选手</option>
            {team.members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="w-20">
          <label className="mb-1 block text-[10px] text-text3">时长(分)</label>
          <input type="number" aria-label="连麦用时分钟" value={mins} onChange={e => setMins(parseInt(e.target.value) || 0)} className="w-full rounded border border-strokeSoft bg-surface3 px-2 py-1 text-xs outline-none focus:border-brand" />
        </div>
        <button onClick={handleAdd} className="rounded bg-surface3 px-3 py-1 text-xs font-semibold text-text1 hover:bg-strokeSoft">添加</button>
      </div>

      <div className="flex flex-col gap-1.5">
        {compliance.coachCalls.records.length === 0 && <div className="text-xs text-text3">暂无连麦记录</div>}
        {compliance.coachCalls.records.map((c: any) => {
          const m1 = team.members.find((m: any) => m.id === c.requestedByMemberId)?.name;
          const m2 = team.members.find((m: any) => m.id === c.targetMemberId)?.name;
          const isOver = compliance.coachCalls.overDurationCalls.some((o: any) => o.id === c.id);
          return (
            <div key={c.id} className="flex items-center justify-between rounded bg-surface3 px-2 py-1.5 text-xs">
              <span className={isOver ? "text-live" : "text-text2"}>
                {m1} → {m2} 连麦 {c.durationMinutes} 分钟 {isOver && "⚠ 超时"}
              </span>
              <button onClick={() => handleRemove(c.id)} aria-label="删除连麦记录" className="text-text3 hover:text-live"><Trash2 className="h-3 w-3" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlannedPickManager({
  team,
  refresh,
}: {
  team: Team;
  refresh: () => Promise<void>;
}) {
  const [member, setMember] = useState("");
  const [pickerValue, setPickerValue] = useState<OperatorCatalogEntry | null>(null);
  const [pendingOperators, setPendingOperators] = useState<OperatorCatalogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const selectionMap = useMemo(() => {
    const nextMap = new Map<string, string[]>();

    for (const currentMember of team.members) {
      for (const pick of currentMember.operatorPicks ?? []) {
        const key = normalizeOperatorName(pick.operatorName);
        if (!key) {
          continue;
        }

        const existing = nextMap.get(key) ?? [];
        if (!existing.includes(currentMember.name)) {
          existing.push(currentMember.name);
        }
        nextMap.set(key, existing);
      }
    }

    return nextMap;
  }, [team.members]);

  const currentMemberName = team.members.find((entry) => entry.id === member)?.name ?? null;
  const currentMemberPicks = useMemo(
    () => team.members.find((entry) => entry.id === member)?.operatorPicks ?? [],
    [team.members, member],
  );
  const currentMemberPickNames = useMemo(
    () => new Set(currentMemberPicks.map((pick) => normalizeOperatorName(pick.operatorName))),
    [currentMemberPicks],
  );
  const pendingOperatorNames = useMemo(
    () => new Set(pendingOperators.map((entry) => normalizeOperatorName(entry.name))),
    [pendingOperators],
  );
  const remainingSlots = Math.max(0, 13 - currentMemberPicks.length - pendingOperators.length);
  const totalPlannedCount = useMemo(
    () => team.members.reduce((sum, currentMember) => sum + (currentMember.operatorPicks?.length ?? 0), 0),
    [team.members],
  );

  const handleMemberChange = (nextMemberId: string) => {
    if (pendingOperators.length > 0 && nextMemberId !== member) {
      const confirmed = confirm("切换选手会清空当前待保存的赛前规划，确定继续吗？");
      if (!confirmed) {
        return;
      }
    }

    setMember(nextMemberId);
    setPickerValue(null);
    setPendingOperators([]);
  };

  const handlePickOperator = (entry: OperatorCatalogEntry | null) => {
    if (!entry) {
      setPickerValue(null);
      return;
    }

    if (!member) {
      toast.error("请先选择要规划的选手");
      setPickerValue(null);
      return;
    }

    const normalizedName = normalizeOperatorName(entry.name);
    if (currentMemberPickNames.has(normalizedName) || pendingOperatorNames.has(normalizedName)) {
      toast.error(`${currentMemberName ?? "该选手"} 的赛前规划里已经有 ${entry.name}`);
      setPickerValue(null);
      return;
    }

    if (remainingSlots <= 0) {
      toast.error(`${currentMemberName ?? "该选手"} 的赛前规划已达到 13 位上限`);
      setPickerValue(null);
      return;
    }

    setPendingOperators((current) => [...current, entry]);
    setPickerValue(null);
  };

  const handleRemovePending = (operatorId: string) => {
    setPendingOperators((current) => current.filter((entry) => entry.id !== operatorId));
  };

  const handleSave = async () => {
    if (!member || pendingOperators.length === 0) {
      return;
    }

    setSaving(true);
    let successCount = 0;

    try {
      for (const operator of pendingOperators) {
        await addPlannedPick(team.id, member, {
          operatorName: operator.name,
          rarity: 6,
        });
        successCount += 1;
      }

      setPendingOperators([]);
      setPickerValue(null);
      await refresh();
      toast.success(`已为 ${currentMemberName ?? "该选手"} 保存 ${successCount} 条赛前抓位规划`);
    } catch (e: any) {
      await refresh();
      setPendingOperators((current) => current.slice(successCount));
      if (successCount > 0) {
        toast.error(`已成功保存 ${successCount} 条，剩余保存失败：${e.message}`);
      } else {
        toast.error(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (memberId: string, pickId: string) => {
    if (!confirm("确定删除这条赛前抓位规划吗？")) return;
    try {
      await deletePlannedPick(team.id, memberId, pickId);
      await refresh();
      toast.success("赛前抓位规划已删除");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="mb-3 grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] md:items-end">
        <div className="min-w-0">
          <label className="mb-1 block text-[10px] text-text3">选手</label>
          <select
            aria-label="赛前规划归属选手"
            className="w-full rounded-xl border border-strokeSoft bg-surface3 px-3 py-2 text-sm outline-none focus:border-brand"
            onChange={(e) => handleMemberChange(e.target.value)}
            value={member}
          >
            <option value="">选择选手</option>
            {team.members.map((currentMember) => <option key={currentMember.id} value={currentMember.id}>{currentMember.name}</option>)}
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-[10px] text-text3">赛前计划六星</label>
          <OperatorCombobox
            clearAfterSelect
            disabled={!member || remainingSlots <= 0 || saving}
            existingSelections={selectionMap}
            keepOpenOnSelect
            onChange={handlePickOperator}
            placeholder={member ? "连续添加赛前计划六星" : "先选择选手再规划抓位"}
            selectedNames={pendingOperatorNames}
            value={pickerValue}
          />
        </div>

        <button
          className="inline-flex h-[52px] items-center justify-center rounded-xl border border-brand/20 bg-brand/10 px-4 text-sm font-semibold text-brand transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={!member || pendingOperators.length === 0 || saving}
          onClick={handleSave}
          type="button"
        >
          {saving ? "保存中..." : `保存 ${pendingOperators.length} 条规划`}
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-white/6 bg-canvas/40 px-3 py-2 text-[11px] text-text3">
        本区域管理展示给观众的赛前计划，不影响实际积分计算。如需修改参与计分的干员记录，请在下方「实际持有干员」区域操作。
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/6 bg-surface3/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">已规划</div>
          <div className="mt-1 text-lg font-semibold text-text1">{totalPlannedCount}</div>
        </div>
        <div className="rounded-2xl border border-brand/15 bg-brand/8 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">当前选手</div>
          <div className="mt-1 truncate text-sm font-semibold text-brand">
            {currentMemberName ? `${currentMemberName} · ${currentMemberPicks.length}/13 已规划` : "请选择选手"}
          </div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-surface3/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">剩余名额</div>
          <div className="mt-1 text-lg font-semibold text-text1">{member ? remainingSlots : 13}</div>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-white/6 bg-surface3/55 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-text3">待保存规划</div>
            <div className="mt-1 text-xs text-text3">
              {member
                ? pendingOperators.length > 0
                  ? `${currentMemberName} 本次将新增 ${pendingOperators.length} 位赛前计划六星`
                  : "从搜索框连续选择后，会先暂存在这里"
                : "先选择选手，再开始规划抓位"}
            </div>
          </div>
          {pendingOperators.length > 0 ? (
            <button
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-text2 transition-colors hover:border-white/15 hover:text-text1"
              onClick={() => setPendingOperators([])}
              type="button"
            >
              清空待保存
            </button>
          ) : null}
        </div>

        {pendingOperators.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pendingOperators.map((entry) => (
              <div
                className="flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/10 px-2.5 py-2 text-sm text-brand"
                key={entry.id}
              >
                <OperatorAvatar entry={entry} name={entry.name} sizeClassName="h-9 w-9" />
                <div className="max-w-[9rem] truncate font-medium">{entry.name}</div>
                <button
                  aria-label={`移除 ${entry.name}`}
                  className="rounded-full border border-brand/20 bg-black/10 p-1 text-brand transition-colors hover:border-brand/35 hover:bg-black/20"
                  onClick={() => handleRemovePending(entry.id)}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-text3">
            暂无待保存规划
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {team.members.every((currentMember) => !(currentMember.operatorPicks?.length)) && (
          <div className="text-xs text-text3">暂无赛前抓位规划</div>
        )}
        {team.members.map((currentMember) => {
          const picks = currentMember.operatorPicks ?? [];
          return (
            <div key={`${currentMember.id}-planned-picks`} className="rounded-2xl border border-white/6 bg-surface3/70 px-3 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text1">{currentMember.name}</div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
                  规划 {picks.length}/13
                </div>
              </div>

              {picks.length ? (
                <div className="flex flex-wrap gap-2">
                  {picks.map((pick) => {
                    const entry = findOperatorCatalogEntry(pick.operatorName);
                    return (
                      <div
                        className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-2.5 py-2 text-sm text-text2"
                        key={pick.id}
                      >
                        <OperatorAvatar entry={entry} name={pick.operatorName} sizeClassName="h-9 w-9" />
                        <div className="max-w-[9rem] truncate font-medium">{pick.operatorName}</div>
                        <button
                          aria-label={`删除 ${currentMember.name} 的 ${pick.operatorName} 规划`}
                          className="rounded-full border border-white/10 bg-black/10 p-1 text-text3 transition-colors hover:border-live/35 hover:bg-live/10 hover:text-live"
                          onClick={() => handleRemove(currentMember.id, pick.id)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-text3">该成员尚未设置赛前抓位规划</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OperatorDraftManager({
  team,
  compliance,
  refresh,
}: {
  team: Team;
  compliance: ComplianceSummary;
  refresh: () => Promise<void>;
}) {
  const [member, setMember] = useState("");
  const [pickerValue, setPickerValue] = useState<OperatorCatalogEntry | null>(null);
  const [pendingOperators, setPendingOperators] = useState<OperatorCatalogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const selectionMap = useMemo(() => {
    const nextMap = new Map<string, string[]>();

    for (const record of compliance.operators.records) {
      const key = normalizeOperatorName(record.operatorName);
      if (!key) {
        continue;
      }

      const memberName = team.members.find((entry) => entry.id === record.memberId)?.name ?? record.memberId;
      const existing = nextMap.get(key) ?? [];
      if (!existing.includes(memberName)) {
        existing.push(memberName);
      }
      nextMap.set(key, existing);
    }

    return nextMap;
  }, [compliance.operators.records, team.members]);

  const duplicateOperatorNames = useMemo(
    () => new Set(compliance.operators.duplicateSixStars.map((entry) => normalizeOperatorName(entry.operatorName))),
    [compliance.operators.duplicateSixStars],
  );

  const currentMemberName = team.members.find((entry) => entry.id === member)?.name ?? null;
  const currentMemberRecords = useMemo(
    () => compliance.operators.records.filter((record) => record.memberId === member),
    [compliance.operators.records, member],
  );
  const currentMemberOperatorNames = useMemo(
    () => new Set(currentMemberRecords.map((record) => normalizeOperatorName(record.operatorName))),
    [currentMemberRecords],
  );
  const pendingOperatorNames = useMemo(
    () => new Set(pendingOperators.map((entry) => normalizeOperatorName(entry.name))),
    [pendingOperators],
  );
  const remainingSlots = Math.max(0, 13 - currentMemberRecords.length - pendingOperators.length);
  const sortedRecords = useMemo(
    () =>
      [...compliance.operators.records].sort((left, right) => {
        const leftDup = duplicateOperatorNames.has(normalizeOperatorName(left.operatorName)) ? 1 : 0;
        const rightDup = duplicateOperatorNames.has(normalizeOperatorName(right.operatorName)) ? 1 : 0;
        if (leftDup !== rightDup) {
          return rightDup - leftDup;
        }

        const rightTime = Date.parse(right.createdAt) || 0;
        const leftTime = Date.parse(left.createdAt) || 0;
        return rightTime - leftTime;
      }),
    [compliance.operators.records, duplicateOperatorNames],
  );

  const handleMemberChange = (nextMemberId: string) => {
    if (pendingOperators.length > 0 && nextMemberId !== member) {
      const confirmed = confirm("切换选手会清空当前待提交的干员，确定继续吗？");
      if (!confirmed) {
        return;
      }
    }

    setMember(nextMemberId);
    setPickerValue(null);
    setPendingOperators([]);
  };

  const handlePickOperator = (entry: OperatorCatalogEntry | null) => {
    if (!entry) {
      setPickerValue(null);
      return;
    }

    if (!member) {
      toast.error("请先选择归属选手");
      setPickerValue(null);
      return;
    }

    const normalizedName = normalizeOperatorName(entry.name);
    if (currentMemberOperatorNames.has(normalizedName) || pendingOperatorNames.has(normalizedName)) {
      toast.error(`${currentMemberName ?? "该选手"} 已记录过 ${entry.name}`);
      setPickerValue(null);
      return;
    }

    if (remainingSlots <= 0) {
      toast.error(`${currentMemberName ?? "该选手"} 已达到 13 位六星上限`);
      setPickerValue(null);
      return;
    }

    setPendingOperators((current) => [...current, entry]);
    setPickerValue(null);
  };

  const handleRemovePending = (operatorId: string) => {
    setPendingOperators((current) => current.filter((entry) => entry.id !== operatorId));
  };

  const handleAdd = async () => {
    if (!member || pendingOperators.length === 0) {
      return;
    }

    setSaving(true);
    let successCount = 0;

    try {
      for (const operator of pendingOperators) {
        await addOperatorDraft(team.id, {
          memberId: member,
          operatorName: operator.name,
          rarity: 6,
          isTemporaryRecruit: false,
        });
        successCount += 1;
      }

      setPendingOperators([]);
      setPickerValue(null);
      await refresh();
      toast.success(`已为 ${currentMemberName ?? "该选手"} 添加 ${successCount} 位六星干员`);
    } catch (e: any) {
      await refresh();
      setPendingOperators((current) => current.slice(successCount));
      if (successCount > 0) {
        toast.error(`已成功添加 ${successCount} 位，剩余提交失败：${e.message}`);
      } else {
        toast.error(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("确定删除干员记录吗？")) return;
    try {
      await deleteOperatorDraft(team.id, id);
      await refresh();
      toast.success("干员记录已删除");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const hasDups = compliance.operators.duplicateCount > 0;

  return (
    <div>
      <div className="mb-3 grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] md:items-end">
        <div className="min-w-0">
          <label className="mb-1 block text-[10px] text-text3">选手</label>
          <select
            aria-label="干员归属选手"
            className="w-full rounded-xl border border-strokeSoft bg-surface3 px-3 py-2 text-sm outline-none focus:border-brand"
            onChange={(e) => handleMemberChange(e.target.value)}
            value={member}
          >
            <option value="">选择选手</option>
            {team.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-[10px] text-text3">六星干员</label>
          <OperatorCombobox
            clearAfterSelect
            disabled={!member || remainingSlots <= 0 || saving}
            existingSelections={selectionMap}
            keepOpenOnSelect
            onChange={handlePickOperator}
            placeholder={member ? "搜索并连续加入六星干员" : "先选择选手再挑干员"}
            selectedNames={pendingOperatorNames}
            value={pickerValue}
          />
        </div>

        <button
          className="inline-flex h-[52px] items-center justify-center rounded-xl border border-brand/20 bg-brand/10 px-4 text-sm font-semibold text-brand transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={!member || pendingOperators.length === 0 || saving}
          onClick={handleAdd}
          type="button"
        >
          {saving ? "提交中..." : `批量添加 ${pendingOperators.length} 位`}
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-white/6 bg-canvas/40 px-3 py-2 text-[11px] text-text3">
        PRTS 头像来源 + 队内重复六星自动置灰。一个选手最多抓 13 位六星，当前支持连续选择后一次性提交。
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/6 bg-surface3/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">已录入</div>
          <div className="mt-1 text-lg font-semibold text-text1">{compliance.operators.records.length}</div>
        </div>
        <div className="rounded-2xl border border-live/15 bg-live/8 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">冲突项</div>
          <div className={`mt-1 text-lg font-semibold ${hasDups ? "text-live" : "text-text1"}`}>
            {compliance.operators.duplicateCount}
          </div>
        </div>
        <div className="rounded-2xl border border-brand/15 bg-brand/8 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">当前成员</div>
          <div className="mt-1 truncate text-sm font-semibold text-brand">
            {currentMemberName ? `${currentMemberName} · ${currentMemberRecords.length}/13 已录入` : "请先选择选手"}
          </div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-surface3/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-text3">剩余名额</div>
          <div className="mt-1 text-lg font-semibold text-text1">{member ? remainingSlots : 13}</div>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-white/6 bg-surface3/55 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-text3">待提交列表</div>
            <div className="mt-1 text-xs text-text3">
              {member
                ? pendingOperators.length > 0
                  ? `${currentMemberName} 本次将新增 ${pendingOperators.length} 位六星`
                  : "从搜索框连续选择干员后，会先暂存在这里"
                : "先选择选手，再开始连续添加六星干员"}
            </div>
          </div>
          {pendingOperators.length > 0 ? (
            <button
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-text2 transition-colors hover:border-white/15 hover:text-text1"
              onClick={() => setPendingOperators([])}
              type="button"
            >
              清空待提交
            </button>
          ) : null}
        </div>

        {pendingOperators.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pendingOperators.map((entry) => (
              <div
                className="flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/10 px-2.5 py-2 text-sm text-brand"
                key={entry.id}
              >
                <OperatorAvatar entry={entry} name={entry.name} sizeClassName="h-9 w-9" />
                <div className="max-w-[9rem] truncate font-medium">{entry.name}</div>
                <button
                  aria-label={`移除 ${entry.name}`}
                  className="rounded-full border border-brand/20 bg-black/10 p-1 text-brand transition-colors hover:border-brand/35 hover:bg-black/20"
                  onClick={() => handleRemovePending(entry.id)}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-text3">
            暂无待提交干员
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {compliance.operators.records.length === 0 && <div className="text-xs text-text3">暂无干员记录</div>}
        {sortedRecords.map((record) => {
          const memberName = team.members.find((entry) => entry.id === record.memberId)?.name ?? record.memberId;
          const isDup = duplicateOperatorNames.has(normalizeOperatorName(record.operatorName));
          const catalogEntry = findOperatorCatalogEntry(record.operatorName);

          return (
            <div
              key={record.id}
              className={[
                "flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition-colors",
                isDup ? "border-live/25 bg-live/10" : "border-white/6 bg-surface3/70",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <OperatorAvatar
                  badge={isDup ? <span className="rounded-full border border-live/35 bg-live/20 px-1.5 py-0.5 text-[10px] font-semibold text-live">!</span> : undefined}
                  dimmed={isDup}
                  entry={catalogEntry}
                  name={record.operatorName}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`truncate text-sm font-semibold ${isDup ? "text-live" : "text-text1"}`}>
                      {memberName}: {record.operatorName}
                    </div>
                    <span
                      className={[
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        isDup
                          ? "border-live/35 bg-live/15 text-live"
                          : "border-brand/20 bg-brand/10 text-brand",
                      ].join(" ")}
                    >
                      {isDup ? "冲突" : "唯一"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-text3">
                    {catalogEntry ? "PRTS 头像" : "历史记录 / 未匹配到头像"}
                    {isDup ? " · 队内重复六星" : " · 当前未冲突"}
                  </div>
                </div>
              </div>

              <button
                aria-label="删除干员记录"
                className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-text3 transition-colors hover:border-live/35 hover:bg-live/10 hover:text-live"
                onClick={() => handleRemove(record.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {hasDups && (
        <div className="mt-2 text-[10px] text-live">重复六星系数扣除: {compliance.coefficientBreakdown.duplicateSixStars.delta * 100}%</div>
      )}
    </div>
  );
}
