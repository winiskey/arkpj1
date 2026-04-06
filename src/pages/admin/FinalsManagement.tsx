import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCcw, Save, ShieldAlert, Trophy } from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import { useToast } from "./ToastContext";
import { replaceFinalsConfig } from "./useAdminApi";
import { OperatorAvatar, OperatorCombobox } from "./OperatorCombobox";
import { findOperatorCatalogEntry, normalizeOperatorName } from "./operatorCatalog";
import type {
  FinalsConfig,
  FinalsPick,
  FinalsTrackCode,
  OperatorCatalogEntry,
  Team,
} from "./types";

const TRACKS: Array<{ code: FinalsTrackCode; label: string; description: string }> = [
  { code: "sami", label: "萨米", description: "萨米赛道启用 Pick 规则。" },
  { code: "sarkaz_chou", label: "萨卡兹·死仇", description: "萨卡兹死仇赛道，独立配置先手与 3 Pick。" },
  { code: "sarkaz_meiyuan", label: "萨卡兹·美愿", description: "萨卡兹美愿赛道，独立配置先手与 3 Pick。" },
];

function buildPick(entry: OperatorCatalogEntry): FinalsPick {
  const createdAt = new Date().toISOString();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${createdAt}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    operatorName: entry.name,
    rarity: entry.rarity,
    createdAt,
  };
}

function isSarkazMember(theme: string) {
  return String(theme ?? "").includes("萨卡兹");
}

function getSarkazMembers(team: Team | null) {
  return (team?.members ?? []).filter((member) => isSarkazMember(member.theme));
}

function rebuildDraftForTeams(current: FinalsConfig, teams: Team[], teamAId: string | null, teamBId: string | null): FinalsConfig {
  const teamA = teams.find((team) => team.id === teamAId) ?? null;
  const teamB = teams.find((team) => team.id === teamBId) ?? null;

  const nextTracks = Object.fromEntries(
    Object.entries(current.tracks).map(([trackCode, track]) => {
      const defaultFirstPickTeamId = trackCode === "sarkaz_meiyuan" ? teamB?.id ?? null : teamA?.id ?? null;
      return [
        trackCode,
        {
          ...track,
          firstPickTeamId: trackCode === "sui" || !track.enabled ? null : defaultFirstPickTeamId,
          picksByTeamId: {
            ...(teamA?.id ? { [teamA.id]: track.picksByTeamId[teamA.id] ?? [] } : {}),
            ...(teamB?.id ? { [teamB.id]: track.picksByTeamId[teamB.id] ?? [] } : {}),
          },
        },
      ];
    }),
  ) as FinalsConfig["tracks"];

  const nextAssignments: FinalsConfig["sarkazLaneAssignments"] = {};
  for (const team of [teamA, teamB].filter(Boolean) as Team[]) {
    const existing = current.sarkazLaneAssignments[team.id];
    const sarkazMembers = getSarkazMembers(team);
    const defaultChou = sarkazMembers[0]?.id ?? null;
    const defaultMeiyuan = sarkazMembers[1]?.id ?? null;
    nextAssignments[team.id] = {
      chouMemberId: sarkazMembers.some((member) => member.id === existing?.chouMemberId) ? existing.chouMemberId : defaultChou,
      meiyuanMemberId: sarkazMembers.some((member) => member.id === existing?.meiyuanMemberId) && existing?.meiyuanMemberId !== existing?.chouMemberId
        ? existing.meiyuanMemberId
        : defaultMeiyuan,
    };
  }

  return {
    ...current,
    teamAId: teamA?.id ?? null,
    teamBId: teamB?.id ?? null,
    tracks: nextTracks,
    sarkazLaneAssignments: nextAssignments,
  };
}

function FinalsTrackCard({
  teamA,
  teamB,
  trackCode,
  trackLabel,
  trackDescription,
  trackConfig,
  onChange,
}: {
  teamA: Team | null;
  teamB: Team | null;
  trackCode: FinalsTrackCode;
  trackLabel: string;
  trackDescription: string;
  trackConfig: FinalsConfig["tracks"][FinalsTrackCode];
  onChange: (nextTrackConfig: FinalsConfig["tracks"][FinalsTrackCode]) => void;
}) {
  const [pickerValueByTeam, setPickerValueByTeam] = useState<Record<string, OperatorCatalogEntry | null>>({});

  useEffect(() => {
    setPickerValueByTeam({});
  }, [trackCode, teamA?.id, teamB?.id]);

  const finalists = [teamA, teamB].filter(Boolean) as Team[];
  const existingSelections = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const team of finalists) {
      for (const pick of trackConfig.picksByTeamId[team.id] ?? []) {
        const key = normalizeOperatorName(pick.operatorName);
        const current = map.get(key) ?? [];
        current.push(team.name);
        map.set(key, current);
      }
    }
    return map;
  }, [finalists, trackConfig.picksByTeamId]);

  const handleAddPick = (team: Team, entry: OperatorCatalogEntry | null) => {
    setPickerValueByTeam((current) => ({ ...current, [team.id]: entry }));
    if (!entry) {
      return;
    }

    const normalizedName = normalizeOperatorName(entry.name);
    const teamPicks = trackConfig.picksByTeamId[team.id] ?? [];
    const otherTeam = finalists.find((candidate) => candidate.id !== team.id) ?? null;
    const otherTeamPicks = otherTeam ? trackConfig.picksByTeamId[otherTeam.id] ?? [] : [];

    if (teamPicks.some((pick) => normalizeOperatorName(pick.operatorName) === normalizedName)) {
      return;
    }
    if (otherTeamPicks.some((pick) => normalizeOperatorName(pick.operatorName) === normalizedName)) {
      return;
    }
    if (teamPicks.length >= 3) {
      return;
    }

    onChange({
      ...trackConfig,
      picksByTeamId: {
        ...trackConfig.picksByTeamId,
        [team.id]: [...teamPicks, buildPick(entry)],
      },
    });
    setPickerValueByTeam((current) => ({ ...current, [team.id]: null }));
  };

  const handleRemovePick = (teamId: string, pickId: string) => {
    onChange({
      ...trackConfig,
      picksByTeamId: {
        ...trackConfig.picksByTeamId,
        [teamId]: (trackConfig.picksByTeamId[teamId] ?? []).filter((pick) => pick.id !== pickId),
      },
    });
  };

  return (
    <section className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-strokeSoft pb-4">
        <div>
          <h2 className="text-lg font-semibold text-text1">{trackLabel}</h2>
          <p className="mt-1 text-sm leading-6 text-text3">{trackDescription}</p>
        </div>
        <select
          className="rounded-xl border border-strokeSoft bg-surface3 px-3 py-2 text-sm text-text1 outline-none focus:border-brand"
          onChange={(event) => onChange({ ...trackConfig, firstPickTeamId: event.target.value || null })}
          value={trackConfig.firstPickTeamId ?? ""}
        >
          <option value="">选择先手方</option>
          {finalists.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {finalists.map((team) => {
          const picks = trackConfig.picksByTeamId[team.id] ?? [];

          return (
            <div className="rounded-2xl border border-white/6 bg-surface3/70 p-4" key={team.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-text1">{team.name}</div>
                  <div className="mt-1 text-xs text-text3">
                    {trackConfig.firstPickTeamId === team.id ? "当前赛道先手方" : "后手方"}
                  </div>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
                  Pick {picks.length}/3
                </div>
              </div>

              <OperatorCombobox
                clearAfterSelect
                disabled={picks.length >= 3}
                existingSelections={existingSelections}
                keepOpenOnSelect
                onChange={(entry) => handleAddPick(team, entry)}
                placeholder="为当前队伍添加决赛 Pick"
                selectedNames={new Set(picks.map((pick) => normalizeOperatorName(pick.operatorName)))}
                value={pickerValueByTeam[team.id] ?? null}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {picks.length > 0 ? picks.map((pick) => {
                  const entry = findOperatorCatalogEntry(pick.operatorName);
                  return (
                    <div
                      className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-2.5 py-2 text-sm text-text2"
                      key={pick.id}
                    >
                      <OperatorAvatar entry={entry} name={pick.operatorName} sizeClassName="h-9 w-9" />
                      <div className="max-w-[9rem] truncate font-medium">{pick.operatorName}</div>
                      <button
                        aria-label={`删除 ${team.name} 的 ${pick.operatorName}`}
                        className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-xs text-text3 transition-colors hover:border-live/35 hover:bg-live/10 hover:text-live"
                        onClick={() => handleRemovePick(team.id, pick.id)}
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                  );
                }) : (
                  <div className="text-xs text-text3">尚未配置 Pick</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FinalsManagement() {
  const { data, loading, error, refresh } = useAdminData();
  const toast = useToast();
  const [draft, setDraft] = useState<FinalsConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const teams = data?.publicContent.teams ?? [];
  const teamA = useMemo(() => teams.find((team) => team.id === draft?.teamAId) ?? null, [draft?.teamAId, teams]);
  const teamB = useMemo(() => teams.find((team) => team.id === draft?.teamBId) ?? null, [draft?.teamBId, teams]);

  useEffect(() => {
    if (data?.finalsConfig) {
      setDraft(structuredClone(data.finalsConfig));
    }
  }, [data?.finalsConfig]);

  if (loading) return <div className="p-8 text-text3">加载中...</div>;
  if (error || !data || !draft) return <div className="p-8 text-live">{error ?? "决赛配置加载失败"}</div>;

  const handleTeamSelection = (slot: "teamAId" | "teamBId", nextTeamId: string) => {
    if (!nextTeamId) {
      return;
    }

    const otherSlot = slot === "teamAId" ? "teamBId" : "teamAId";
    if (draft[otherSlot] === nextTeamId) {
      toast.error("两支决赛队伍不能相同");
      return;
    }

    setDraft((current) => current ? rebuildDraftForTeams(
      current,
      teams,
      slot === "teamAId" ? nextTeamId : current.teamAId,
      slot === "teamBId" ? nextTeamId : current.teamBId,
    ) : current);
  };

  const handleLaneAssignmentChange = (teamId: string, lane: "chouMemberId" | "meiyuanMemberId", memberId: string) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const currentAssignment = current.sarkazLaneAssignments[teamId] ?? { chouMemberId: null, meiyuanMemberId: null };
      const nextAssignment = {
        ...currentAssignment,
        [lane]: memberId || null,
      };

      if (nextAssignment.chouMemberId && nextAssignment.chouMemberId === nextAssignment.meiyuanMemberId) {
        toast.error("同一名萨卡兹选手不能同时占用死仇与美愿赛道");
        return current;
      }

      return {
        ...current,
        sarkazLaneAssignments: {
          ...current.sarkazLaneAssignments,
          [teamId]: nextAssignment,
        },
      };
    });
  };

  const handleTrackChange = (trackCode: FinalsTrackCode, nextTrackConfig: FinalsConfig["tracks"][FinalsTrackCode]) => {
    setDraft((current) => current ? {
      ...current,
      tracks: {
        ...current.tracks,
        [trackCode]: nextTrackConfig,
      },
    } : current);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await replaceFinalsConfig(draft);
      await refresh();
      toast.success("决赛配置已保存");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const finalists = [teamA, teamB].filter(Boolean) as Team[];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl font-bold text-text1">决赛配置</h1>
          <p className="mt-1 text-sm text-text3">
            管理当前决赛对阵、萨卡兹死仇 / 美愿赛道绑定，以及萨米 / 两条萨卡兹赛道的 Pick。
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saving}
          onClick={handleSave}
          type="button"
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : "保存决赛配置"}
        </button>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
          <div className="mb-5 flex items-start gap-3 border-b border-strokeSoft pb-4">
            <div className="rounded-2xl border border-brand/20 bg-brand/10 p-3 text-brand">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text1">决赛对阵</h2>
              <p className="mt-1 text-sm leading-6 text-text3">
                当前系统默认预置草莓天下第一 vs mygo，可在这里替换为其他两支队伍。
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
              <span className="mb-2 block text-xs text-text3">队伍 A</span>
              <select
                className="w-full bg-transparent text-base text-text1 outline-none"
                onChange={(event) => handleTeamSelection("teamAId", event.target.value)}
                value={draft.teamAId ?? ""}
              >
                {teams.map((team) => (
                  <option className="bg-surface2 text-text1" key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
              <span className="mb-2 block text-xs text-text3">队伍 B</span>
              <select
                className="w-full bg-transparent text-base text-text1 outline-none"
                onChange={(event) => handleTeamSelection("teamBId", event.target.value)}
                value={draft.teamBId ?? ""}
              >
                {teams.map((team) => (
                  <option className="bg-surface2 text-text1" key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
          <div className="mb-5 flex items-start gap-3 border-b border-strokeSoft pb-4">
            <div className="rounded-2xl border border-live/20 bg-live/10 p-3 text-live">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text1">萨卡兹赛道绑定</h2>
              <p className="mt-1 text-sm leading-6 text-text3">
                每支决赛队需要把两名萨卡兹选手分别绑定到「死仇 / 美愿」赛道，否则萨卡兹成绩单无法锁定。
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {finalists.map((team) => {
              const sarkazMembers = getSarkazMembers(team);
              const assignment = draft.sarkazLaneAssignments[team.id] ?? { chouMemberId: null, meiyuanMemberId: null };

              return (
                <div className="rounded-xl border border-white/6 bg-surface3/70 p-4" key={team.id}>
                  <div className="mb-3 text-sm font-semibold text-text1">{team.name}</div>

                  {sarkazMembers.length >= 2 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="rounded-xl border border-strokeSoft bg-surface2 px-3 py-3">
                        <span className="mb-2 block text-xs text-text3">死仇赛道</span>
                        <select
                          className="w-full bg-transparent text-sm text-text1 outline-none"
                          onChange={(event) => handleLaneAssignmentChange(team.id, "chouMemberId", event.target.value)}
                          value={assignment.chouMemberId ?? ""}
                        >
                          <option value="">选择选手</option>
                          {sarkazMembers.map((member) => (
                            <option className="bg-surface2 text-text1" key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="rounded-xl border border-strokeSoft bg-surface2 px-3 py-3">
                        <span className="mb-2 block text-xs text-text3">美愿赛道</span>
                        <select
                          className="w-full bg-transparent text-sm text-text1 outline-none"
                          onChange={(event) => handleLaneAssignmentChange(team.id, "meiyuanMemberId", event.target.value)}
                          value={assignment.meiyuanMemberId ?? ""}
                        >
                          <option value="">选择选手</option>
                          {sarkazMembers.map((member) => (
                            <option className="bg-surface2 text-text1" key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="text-sm text-live">当前队伍没有足够的萨卡兹选手可绑定到死仇 / 美愿赛道。</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mb-6 rounded-2xl border border-strokeSoft bg-surface2 p-5 shadow-panel">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-green-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-2 text-sm leading-7 text-text2">
            <div>决赛当前采用只 P 不 B。</div>
            <div>启用 Pick 的赛道只有萨米、萨卡兹死仇、萨卡兹美愿；界园不参与 Pick / BP。</div>
            <div>系统会在录分时自动提示“池外干员 / 使用对方 Pick 干员”，但当前阶段不会自动扣分。</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {TRACKS.map((track) => (
          <FinalsTrackCard
            key={track.code}
            onChange={(nextTrackConfig) => handleTrackChange(track.code, nextTrackConfig)}
            teamA={teamA}
            teamB={teamB}
            trackCode={track.code}
            trackConfig={draft.tracks[track.code]}
            trackDescription={track.description}
            trackLabel={track.label}
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-strokeSoft bg-surface2 p-4 text-sm text-text3 shadow-panel">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          决赛配置保存后，单人计分器会自动读取最新的赛道绑定与 Pick 列表。
        </div>
      </div>
    </div>
  );
}
