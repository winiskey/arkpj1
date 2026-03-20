import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clipboard,
  LoaderCircle,
  RefreshCcw,
  Save,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import { useToast } from "./ToastContext";
import {
  calculateSoloScore,
  fetchScoreSheet,
  fetchTeamAggregate,
  publishTeam,
  upsertScoreSheet,
} from "./useAdminApi";
import type { Team, TeamAggregate, TeamMember } from "./types";
import {
  createDefaultSnapshots,
  getDefaultThemeSnapshot,
  hydrateThemeSnapshot,
  inferThemeCodeFromMemberTheme,
  type CalculatorTab,
  type CalculatorTheme,
  type CheckboxField,
  type NumberField,
  type SelectField,
  type SnapshotValue,
  type ThemeSnapshot,
  SAMI_BASE_ROWS,
  SAMI_END_LINK_FIELD,
  SAMI_SPECIAL_FIELDS,
  SAMI_STAGE_FIELDS,
  SARKAZ_BASE_ROWS,
  SARKAZ_ENDING_GROUPS,
  SARKAZ_KEY_FIELDS,
  SARKAZ_RELIC_FIELD,
  SARKAZ_ROLL_FIELD,
  SARKAZ_STAGE_FIELDS,
  SUI_BASE_ROWS,
  SUI_BEAST_LOSS_FIELD,
  SUI_ENDING_FIELD,
  SUI_ENDING_PERF_FIELD,
  SUI_MULTIPLIER_FIELDS,
  SUI_RELIC_FIELDS,
  SUI_RULE_FIELD,
  SUI_STAGE_FIELDS,
  TAB_LABELS,
  THEME_LABELS,
} from "./scoreCalculatorConfig";

type ToolbarTone = "muted" | "error" | "success";
type SheetViewStatus = "draft" | "final" | "published" | "empty" | "overview" | "mismatch";

interface ToolbarState {
  text: string;
  tone: ToolbarTone;
}

interface SheetViewState {
  label: string;
  status: SheetViewStatus;
}

interface PreviewState {
  formula: string;
  multiplier?: number;
  rawScore?: number;
  score: number;
}

interface ThemeBaselineState {
  note: string;
  sheetId: string | null;
  snapshot: ThemeSnapshot;
  status: SheetViewStatus;
}

const EMPTY_PREVIEW: PreviewState = {
  score: 0,
  formula: "等待输入",
};

function createDefaultThemeBaselines(): Record<CalculatorTheme, ThemeBaselineState> {
  return {
    sami: {
      note: "",
      sheetId: null,
      snapshot: getDefaultThemeSnapshot("sami"),
      status: "empty",
    },
    sarkaz: {
      note: "",
      sheetId: null,
      snapshot: getDefaultThemeSnapshot("sarkaz"),
      status: "empty",
    },
    sui: {
      note: "",
      sheetId: null,
      snapshot: getDefaultThemeSnapshot("sui"),
      status: "empty",
    },
  };
}

function areSnapshotsEqual(left: ThemeSnapshot, right: ThemeSnapshot) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function countCheckedFields(snapshot: ThemeSnapshot, fields: CheckboxField[]) {
  return fields.reduce((count, field) => count + (snapshot[field.key] ? 1 : 0), 0);
}

function countPositiveFields(snapshot: ThemeSnapshot, rows: NumberField[][]) {
  return rows.flat().reduce((count, field) => count + (Number(snapshot[field.key] ?? 0) > 0 ? 1 : 0), 0);
}

function formatScore(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  const rounded = Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : 0;

  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getSheetLabel(status: SheetViewStatus) {
  switch (status) {
    case "draft":
      return "待审";
    case "final":
      return "已锁定";
    case "published":
      return "已发布";
    case "overview":
      return "战队聚合";
    case "mismatch":
      return "主题不匹配";
    default:
      return "待录入";
  }
}

function getToolbarClasses(tone: ToolbarTone) {
  if (tone === "error") {
    return "border-live/20 bg-live/10 text-live";
  }

  if (tone === "success") {
    return "border-green-500/20 bg-green-500/10 text-green-400";
  }

  return "border-strokeSoft bg-surface3 text-text2";
}

function getStatusChipClasses(status: SheetViewStatus) {
  if (status === "final") {
    return "border-sky-400/25 bg-sky-400/10 text-sky-300";
  }

  if (status === "published") {
    return "border-green-500/25 bg-green-500/10 text-green-300";
  }

  if (status === "overview") {
    return "border-brand/25 bg-brand/10 text-brand";
  }

  if (status === "mismatch") {
    return "border-live/25 bg-live/10 text-live";
  }

  if (status === "empty") {
    return "border-white/10 bg-surface3 text-text3";
  }

  return "border-brand/25 bg-brand/10 text-brand";
}

function buildIdentityText(team: Team | null, member: TeamMember | null, tab: CalculatorTab) {
  if (!team) {
    return "请选择战队与选手";
  }

  const parts = [team.name];
  if (member) {
    parts.push(member.name);
  }
  parts.push(TAB_LABELS[tab]);

  return parts.join(" / ");
}

function CheckboxCard({
  checked,
  field,
  onChange,
}: {
  checked: boolean;
  field: CheckboxField;
  onChange: (checked: boolean) => void;
}) {
  const toneClass = field.tone === "danger"
    ? checked
      ? "border-live/30 bg-live/10 text-white"
      : "border-strokeSoft bg-surface3 text-text2"
    : checked
      ? "border-brand/30 bg-brand/10 text-white"
      : "border-strokeSoft bg-surface3 text-text2";

  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${toneClass}`}>
      <span className="text-sm leading-6">{field.label}</span>
      <div className="flex items-center gap-3">
        {field.badge ? (
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${field.tone === "danger" ? "bg-live/15 text-live" : "bg-brand/15 text-brand"}`}>
            {field.badge}
          </span>
        ) : null}
        <input
          checked={checked}
          className="h-4 w-4 accent-[#d6c08a]"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </div>
    </label>
  );
}

function NumberInput({
  field,
  value,
  onChange,
}: {
  field: NumberField;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
      <span className="mb-2 block text-xs text-text3">{field.label}</span>
      <input
        className="w-full bg-transparent text-base text-text1 outline-none"
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value || 0))}
        onFocus={(event) => event.currentTarget.select()}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectInput({
  field,
  value,
  onChange,
}: {
  field: SelectField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
      <span className="mb-2 block text-xs text-text3">{field.label}</span>
      <select
        className="w-full bg-transparent text-base text-text1 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {field.options.map((option) => (
          <option className="bg-surface2 text-text1" key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionCard({
  children,
  description,
  onReset,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  onReset?: () => void;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-strokeSoft pb-4">
        <div>
          <h2 className="text-lg font-semibold text-text1">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-text3">{description}</p> : null}
        </div>
        {onReset ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-live/25 bg-live/10 px-3 py-2 text-sm text-live transition-colors hover:bg-live/15"
            onClick={onReset}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
            重置
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.12em] text-text3">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-text1">{value}</div>
    </div>
  );
}

function AlertList({
  items,
  tone,
  title,
}: {
  items: string[];
  title: string;
  tone: "danger" | "warning";
}) {
  if (!items.length) {
    return null;
  }

  const classes = tone === "danger"
    ? "border-live/20 bg-live/10 text-live"
    : "border-brand/20 bg-brand/10 text-brand";
  const Icon = tone === "danger" ? ShieldAlert : AlertTriangle;

  return (
    <div className={`rounded-2xl border px-5 py-4 ${classes}`}>
      <div className="mb-3 flex items-center gap-2 font-medium">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="space-y-2 text-sm leading-6">
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </div>
  );
}

export function ScoreCalculator() {
  const { data, error, loading } = useAdminData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<CalculatorTab>("team");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [note, setNote] = useState("");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetView, setSheetView] = useState<SheetViewState>({ status: "empty", label: "待录入" });
  const [toolbar, setToolbar] = useState<ToolbarState>({
    tone: "muted",
    text: "等待加载后台数据...",
  });
  const [snapshots, setSnapshots] = useState(() => createDefaultSnapshots());
  const [themeBaselines, setThemeBaselines] = useState(() => createDefaultThemeBaselines());
  const [preview, setPreview] = useState<PreviewState>(EMPTY_PREVIEW);
  const [teamAggregate, setTeamAggregate] = useState<TeamAggregate | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | "draft" | "final" | "publish">(null);
  const [aggregateReloadToken, setAggregateReloadToken] = useState(0);
  const [sheetReloadToken, setSheetReloadToken] = useState(0);

  const aggregateRequestRef = useRef(0);
  const sheetRequestRef = useRef(0);
  const previewRequestRef = useRef(0);

  const teams = data?.publicContent.teams ?? [];
  const matches = data?.publicContent.matches ?? [];
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );
  const teamMembers = selectedTeam?.members ?? [];
  const selectedMember = useMemo(
    () => teamMembers.find((member) => member.id === selectedMemberId) ?? null,
    [selectedMemberId, teamMembers],
  );
  const availableMatches = useMemo(
    () => matches.filter((match) => match.teamId === selectedTeamId),
    [matches, selectedTeamId],
  );
  const bootstrapAggregate = useMemo(
    () => data?.aggregates.find((aggregate) => aggregate.teamId === selectedTeamId) ?? null,
    [data, selectedTeamId],
  );
  const aggregateForView = teamAggregate ?? bootstrapAggregate;
  const expectedTheme = useMemo(
    () => inferThemeCodeFromMemberTheme(selectedMember?.theme),
    [selectedMember?.theme],
  );
  const activeThemeSnapshot = activeTab === "team" ? null : snapshots[activeTab];
  const activeThemeBaseline = activeTab === "team" ? null : themeBaselines[activeTab];
  const identityText = useMemo(
    () => buildIdentityText(selectedTeam, selectedMember, activeTab),
    [activeTab, selectedMember, selectedTeam],
  );
  const hasUnsavedChanges = useMemo(() => {
    if (activeTab === "team" || !activeThemeSnapshot || !activeThemeBaseline) {
      return false;
    }

    return note !== activeThemeBaseline.note || !areSnapshotsEqual(activeThemeSnapshot, activeThemeBaseline.snapshot);
  }, [activeTab, activeThemeBaseline, activeThemeSnapshot, note]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!teams.length) {
      if (selectedTeamId) {
        setSelectedTeamId("");
      }
      return;
    }

    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [selectedTeamId, teams]);

  useEffect(() => {
    if (!selectedTeam) {
      if (selectedMemberId) {
        setSelectedMemberId("");
      }
      return;
    }

    if (!teamMembers.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(teamMembers[0]?.id ?? "");
    }
  }, [selectedMemberId, selectedTeam, teamMembers]);

  useEffect(() => {
    if (!selectedTeam) {
      if (selectedMatchId) {
        setSelectedMatchId("");
      }
      return;
    }

    if (selectedMatchId && !availableMatches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId("");
    }
  }, [availableMatches, selectedMatchId, selectedTeam]);

  useEffect(() => {
    setTeamAggregate(bootstrapAggregate ?? null);
  }, [bootstrapAggregate, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamAggregate(null);
      return;
    }

    const requestId = aggregateRequestRef.current + 1;
    aggregateRequestRef.current = requestId;
    setAggregateLoading(true);

    fetchTeamAggregate(selectedTeamId)
      .then((aggregate) => {
        if (aggregateRequestRef.current !== requestId) {
          return;
        }

        setTeamAggregate(aggregate);
        if (aggregateReloadToken > 0) {
          setToolbar({ tone: "success", text: "已同步战队聚合结果" });
        }
      })
      .catch((fetchError) => {
        if (aggregateRequestRef.current !== requestId) {
          return;
        }

        setToolbar({
          tone: "error",
          text: fetchError instanceof Error ? fetchError.message : "加载战队聚合失败",
        });
      })
      .finally(() => {
        if (aggregateRequestRef.current === requestId) {
          setAggregateLoading(false);
        }
      });
  }, [aggregateReloadToken, selectedTeamId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (activeTab === "team") {
      setSheetView({ status: "overview", label: getSheetLabel("overview") });
      setSheetLoading(false);
      setToolbar({
        tone: "muted",
        text: selectedTeam ? "查看当前战队的聚合得分、发布条件与成员状态" : "请选择战队后查看聚合结果",
      });
      return;
    }

    if (!selectedTeam || !selectedMember) {
      setSheetId(null);
      setNote("");
      setSnapshots((current) => ({
        ...current,
        [activeTab]: getDefaultThemeSnapshot(activeTab),
      }));
      setThemeBaselines((current) => ({
        ...current,
        [activeTab]: {
          note: "",
          sheetId: null,
          snapshot: getDefaultThemeSnapshot(activeTab),
          status: "empty",
        },
      }));
      setSheetView({ status: "empty", label: getSheetLabel("empty") });
      setSheetLoading(false);
      setToolbar({ tone: "error", text: "请选择战队和选手后再录分" });
      return;
    }

    if (expectedTheme !== activeTab) {
      const mismatchLabel = expectedTheme ? `应填 ${THEME_LABELS[expectedTheme]}` : "主题未配置";
      setSheetId(null);
      setNote("");
      setSnapshots((current) => ({
        ...current,
        [activeTab]: getDefaultThemeSnapshot(activeTab),
      }));
      setThemeBaselines((current) => ({
        ...current,
        [activeTab]: {
          note: "",
          sheetId: null,
          snapshot: getDefaultThemeSnapshot(activeTab),
          status: "mismatch",
        },
      }));
      setSheetView({ status: "mismatch", label: mismatchLabel });
      setSheetLoading(false);
      setToolbar({
        tone: "error",
        text: expectedTheme
          ? `当前选手 ${selectedMember.name} 只能录入 ${THEME_LABELS[expectedTheme]}`
          : `当前选手 ${selectedMember.name} 未配置可识别主题`,
      });
      return;
    }

    const requestId = sheetRequestRef.current + 1;
    sheetRequestRef.current = requestId;
    setSheetLoading(true);
    setToolbar({ tone: "muted", text: "正在加载已有成绩单..." });

    fetchScoreSheet({
      teamId: selectedTeam.id,
      memberId: selectedMember.id,
      theme: activeTab,
      matchId: selectedMatchId || null,
    })
      .then(({ sheet }) => {
        if (sheetRequestRef.current !== requestId) {
          return;
        }

        if (sheet) {
          const hydratedSnapshot = hydrateThemeSnapshot(activeTab, sheet.snapshot);
          setSheetId(sheet.id);
          setNote(sheet.note ?? "");
          setSnapshots((current) => ({
            ...current,
            [activeTab]: hydratedSnapshot,
          }));
          setThemeBaselines((current) => ({
            ...current,
            [activeTab]: {
              note: sheet.note ?? "",
              sheetId: sheet.id,
              snapshot: hydratedSnapshot,
              status: sheet.status,
            },
          }));
          setSheetView({ status: sheet.status, label: getSheetLabel(sheet.status) });
          setToolbar({
            tone: sheet.status === "published" ? "error" : "success",
            text: sheet.status === "published" ? "当前成绩单已发布，如需改动请回到审核流程处理" : "已加载已有成绩单",
          });
          return;
        }

        setSheetId(null);
        setNote("");
        setSnapshots((current) => ({
          ...current,
          [activeTab]: getDefaultThemeSnapshot(activeTab),
        }));
        setThemeBaselines((current) => ({
          ...current,
          [activeTab]: {
            note: "",
            sheetId: null,
            snapshot: getDefaultThemeSnapshot(activeTab),
            status: "empty",
          },
        }));
        setSheetView({ status: "empty", label: getSheetLabel("empty") });
        setToolbar({ tone: "muted", text: "当前主题暂无成绩单，可直接录入" });
      })
      .catch((fetchError) => {
        if (sheetRequestRef.current !== requestId) {
          return;
        }

        setToolbar({
          tone: "error",
          text: fetchError instanceof Error ? fetchError.message : "加载成绩单失败",
        });
      })
      .finally(() => {
        if (sheetRequestRef.current === requestId) {
          setSheetLoading(false);
        }
      });
  }, [activeTab, data, expectedTheme, selectedMatchId, selectedMember, selectedTeam, sheetReloadToken]);

  useEffect(() => {
    if (activeTab === "team") {
      if (!aggregateForView) {
        setPreview({
          score: 0,
          formula: selectedTeam ? "战队聚合加载中..." : "请选择战队后查看汇总结果",
        });
      } else {
        setPreview({
          score: aggregateForView.finalTotal ?? aggregateForView.teamTotal,
          formula: `总分 = (${aggregateForView.formatted.preCoefficientTotal} x ${aggregateForView.formatted.coefficient})`,
          rawScore: aggregateForView.preCoefficientTotal,
          multiplier: aggregateForView.coefficient,
        });
      }
      setPreviewLoading(false);
      return;
    }

    if (!selectedTeam || !selectedMember) {
      setPreview({ score: 0, formula: "请选择战队与选手" });
      setPreviewLoading(false);
      return;
    }

    if (expectedTheme !== activeTab) {
      setPreview({
        score: 0,
        formula: expectedTheme ? `当前选手仅支持 ${THEME_LABELS[expectedTheme]}` : "当前选手未配置主题",
      });
      setPreviewLoading(false);
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;

    const timer = window.setTimeout(() => {
      if (previewRequestRef.current !== requestId) return;
      setPreviewLoading(true);

      calculateSoloScore(activeTab, activeThemeSnapshot ?? {})
        .then((result) => {
          if (previewRequestRef.current !== requestId) {
            return;
          }

          setPreview({
            score: result.previewScore,
            formula: result.formulaText,
            rawScore: result.rawScore,
            multiplier: result.multiplier,
          });
        })
        .catch((fetchError) => {
          if (previewRequestRef.current !== requestId) {
            return;
          }

          setPreview({
            score: 0,
            formula: fetchError instanceof Error ? fetchError.message : "预览计算失败",
          });
        })
        .finally(() => {
          if (previewRequestRef.current === requestId) {
            setPreviewLoading(false);
          }
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTab, activeThemeSnapshot, aggregateForView, expectedTheme, selectedMember, selectedTeam]);

  const canPublish = Boolean(selectedTeam && aggregateForView?.publishReady && actionLoading !== "publish");
  const canEditActiveSheet = Boolean(
    activeTab !== "team"
    && selectedTeam
    && selectedMember
    && expectedTheme === activeTab
    && sheetView.status !== "published"
    && !sheetLoading,
  );

  function setToolbarState(text: string, tone: ToolbarTone = "muted") {
    setToolbar({ text, tone });
  }

  function confirmLeaveWithUnsavedChanges(targetLabel?: string) {
    if (!hasUnsavedChanges || activeTab === "team") {
      return true;
    }

    const targetSuffix = targetLabel ? `并切换到${targetLabel}` : "";
    return window.confirm(`当前${TAB_LABELS[activeTab]}有未保存改动，确定放弃这些内容${targetSuffix}吗？`);
  }

  function updateSnapshotField(theme: CalculatorTheme, key: string, value: SnapshotValue) {
    setSnapshots((current) => ({
      ...current,
      [theme]: {
        ...current[theme],
        [key]: value,
      },
    }));
  }

  async function handleCopyScore() {
    try {
      await navigator.clipboard.writeText(formatScore(preview.score));
      setToolbarState("当前分数已复制", "success");
    } catch {
      setToolbarState("复制失败，请检查浏览器权限", "error");
    }
  }

  function resetCurrentTheme() {
    if (activeTab === "team") {
      setAggregateReloadToken((value) => value + 1);
      return;
    }

    if (!window.confirm("确定要清空当前主题的录分内容吗？")) {
      return;
    }

    setSheetId(null);
    setNote("");
    setSheetView({ status: "empty", label: getSheetLabel("empty") });
    setSnapshots((current) => ({
      ...current,
      [activeTab]: getDefaultThemeSnapshot(activeTab),
    }));
    setThemeBaselines((current) => ({
      ...current,
      [activeTab]: {
        note: "",
        sheetId: null,
        snapshot: getDefaultThemeSnapshot(activeTab),
        status: "empty",
      },
    }));
    setToolbarState("当前主题表单已清空，未保存的改动已丢弃", "success");
  }

  async function handleSave(nextStatus: "draft" | "final") {
    if (activeTab === "team" || !selectedTeam || !selectedMember || expectedTheme !== activeTab) {
      setToolbarState("请先选择正确的战队、选手与主题", "error");
      return;
    }

    setActionLoading(nextStatus);

    try {
      const result = await upsertScoreSheet({
        id: sheetId ?? undefined,
        teamId: selectedTeam.id,
        memberId: selectedMember.id,
        matchId: selectedMatchId || null,
        theme: activeTab,
        snapshot: activeThemeSnapshot ?? {},
        note: note.trim(),
        status: nextStatus,
        calculatorVersion: "jingchuge-react-admin-v1",
      });

      setSheetId(result.sheet.id);
      setNote(result.sheet.note ?? "");
      setSheetView({ status: result.sheet.status, label: getSheetLabel(result.sheet.status) });
      setTeamAggregate(result.aggregate);
      setThemeBaselines((current) => ({
        ...current,
        [activeTab]: {
          note: result.sheet.note ?? "",
          sheetId: result.sheet.id,
          snapshot: hydrateThemeSnapshot(activeTab, result.sheet.snapshot),
          status: result.sheet.status,
        },
      }));
      setToolbarState(nextStatus === "final" ? "成绩单已锁定" : "草稿已保存", "success");
      toast.success(nextStatus === "final" ? "成绩单已锁定" : "草稿已保存");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "保存失败";
      setToolbarState(message, "error");
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  function handleTabChange(nextTab: CalculatorTab) {
    if (nextTab === activeTab) {
      return;
    }

    if (!confirmLeaveWithUnsavedChanges(`「${TAB_LABELS[nextTab]}」`)) {
      return;
    }

    setActiveTab(nextTab);
  }

  function handleTeamSelection(nextTeamId: string) {
    if (nextTeamId === selectedTeamId) {
      return;
    }

    const nextTeamName = teams.find((team) => team.id === nextTeamId)?.name;
    if (!confirmLeaveWithUnsavedChanges(nextTeamName ? `「${nextTeamName}」` : undefined)) {
      return;
    }

    setSelectedTeamId(nextTeamId);
  }

  function handleMemberSelection(nextMemberId: string) {
    if (nextMemberId === selectedMemberId) {
      return;
    }

    const nextMemberName = teamMembers.find((member) => member.id === nextMemberId)?.name;
    if (!confirmLeaveWithUnsavedChanges(nextMemberName ? `选手「${nextMemberName}」` : undefined)) {
      return;
    }

    setSelectedMemberId(nextMemberId);
  }

  function handleMatchSelection(nextMatchId: string) {
    if (nextMatchId === selectedMatchId) {
      return;
    }

    const nextMatch = availableMatches.find((match) => match.id === nextMatchId);
    if (!confirmLeaveWithUnsavedChanges(nextMatch ? `场次「${nextMatch.id}」` : "新的场次过滤")) {
      return;
    }

    setSelectedMatchId(nextMatchId);
  }

  async function handlePublish() {
    if (!selectedTeam || !aggregateForView?.publishReady) {
      setToolbarState("当前战队尚未满足发布条件", "error");
      return;
    }

    if (!window.confirm(`确定发布「${selectedTeam.name}」的整队成绩吗？`)) {
      return;
    }

    setActionLoading("publish");

    try {
      const result = await publishTeam(selectedTeam.id);
      setTeamAggregate(result.aggregate);
      setToolbarState("整队成绩已发布", "success");
      setSheetReloadToken((value) => value + 1);
      toast.success(`${selectedTeam.name} 已发布`);
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "发布失败";
      setToolbarState(message, "error");
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-text3">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-live/20 bg-live/10 px-6 py-4 text-live">
          {error ?? "加载管理数据失败"}
        </div>
      </div>
    );
  }

  const teamAggregateStatus = aggregateForView?.status.label ?? "待录入";
  const selectedMatch = availableMatches.find((match) => match.id === selectedMatchId) ?? null;
  const activeMatchLabel = selectedMatch ? `${selectedMatch.phase} · ${selectedMatch.startTime}` : "未限定场次";
  const activeThemeActionHint = activeTab === "team"
    ? aggregateForView?.publishReady
      ? "当前战队已满足发布条件，可以直接发布整队成绩。"
      : "先完成所有成员锁定，并处理阻塞项后再发布整队。"
    : !selectedTeam || !selectedMember
      ? "先选择战队和选手，再开始录入。"
      : expectedTheme !== activeTab
        ? `当前选手应录入 ${expectedTheme ? THEME_LABELS[expectedTheme] : "正确主题"}。`
        : sheetView.status === "published"
          ? "当前成绩单已发布，如需改动请先走审核流程。"
          : hasUnsavedChanges
            ? "当前存在未保存改动，建议先保存草稿。"
            : sheetView.status === "final"
              ? "成绩单已锁定，可以继续核对整队状态或发布。"
              : "当前主题可以继续录入或保存草稿。";

  const samiSummary = {
    base: countPositiveFields(snapshots.sami, SAMI_BASE_ROWS),
    specials: countCheckedFields(snapshots.sami, SAMI_SPECIAL_FIELDS),
    stages: countCheckedFields(snapshots.sami, SAMI_STAGE_FIELDS),
  };
  const sarkazSummary = {
    base: countPositiveFields(snapshots.sarkaz, SARKAZ_BASE_ROWS),
    flags: countCheckedFields(snapshots.sarkaz, SARKAZ_KEY_FIELDS),
    stages: countCheckedFields(snapshots.sarkaz, SARKAZ_STAGE_FIELDS),
  };
  const suiSummary = {
    base: countPositiveFields(snapshots.sui, SUI_BASE_ROWS),
    multipliers: countCheckedFields(snapshots.sui, SUI_MULTIPLIER_FIELDS),
    relics: countCheckedFields(snapshots.sui, SUI_RELIC_FIELDS),
    stages: countCheckedFields(snapshots.sui, SUI_STAGE_FIELDS),
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl font-bold text-text1">单人计分器</h1>
          <p className="mt-1 text-sm text-text3">
            选择战队与选手后，直接在 React 页面内录入快照数据并提交成绩单。
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-brand">
          <Calculator className="h-4 w-4" />
          预览分数由后端实时重算
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-strokeSoft bg-surface2 p-6 shadow-panel">
        <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
          <label className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
            <span className="mb-2 block text-xs text-text3">战队</span>
            <select
              className="w-full bg-transparent text-base text-text1 outline-none"
              onChange={(event) => handleTeamSelection(event.target.value)}
              value={selectedTeamId}
            >
              {teams.map((team) => (
                <option className="bg-surface2 text-text1" key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
            <span className="mb-2 block text-xs text-text3">选手</span>
            <select
              className="w-full bg-transparent text-base text-text1 outline-none"
              onChange={(event) => handleMemberSelection(event.target.value)}
              value={selectedMemberId}
            >
              {teamMembers.length ? (
                teamMembers.map((member) => (
                  <option className="bg-surface2 text-text1" key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))
              ) : (
                <option className="bg-surface2 text-text1" value="">
                  暂无选手
                </option>
              )}
            </select>
          </label>

          <label className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
            <span className="mb-2 block text-xs text-text3">场次</span>
            <select
              className="w-full bg-transparent text-base text-text1 outline-none"
              onChange={(event) => handleMatchSelection(event.target.value)}
              value={selectedMatchId}
            >
              <option className="bg-surface2 text-text1" value="">
                不限场次
              </option>
              {availableMatches.map((match) => (
                <option className="bg-surface2 text-text1" key={match.id} value={match.id}>
                  {`${match.id} · ${match.phase} · ${match.startTime}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.7fr)_auto]">
          <label className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
            <span className="mb-2 block text-xs text-text3">备注</span>
            <input
              className="w-full bg-transparent text-base text-text1 outline-none disabled:text-text3"
              disabled={!canEditActiveSheet}
              onChange={(event) => setNote(event.target.value)}
              placeholder="可选，保存时会写入成绩单备注"
              type="text"
              value={note}
            />
          </label>

          <div className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
            <div className="mb-2 text-xs text-text3">当前对象</div>
            <div className="text-base font-semibold text-text1">{identityText}</div>
            <div className="mt-2 text-xs text-text3">
              {selectedMember ? `${selectedMember.role} / ${selectedMember.theme}` : "等待选择选手"}
            </div>
          </div>

          <div className={`inline-flex min-h-[56px] items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold ${getStatusChipClasses(sheetView.status)}`}>
            {sheetView.label}
          </div>
        </div>

        {selectedTeam ? (
          <div className="mt-4 rounded-2xl border border-strokeSoft bg-surface3/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-text3">快捷切换</div>
                <div className="mt-1 text-sm text-text2">直接切换当前战队成员，避免频繁下拉选择。</div>
              </div>
              <div className="rounded-full border border-strokeSoft bg-surface2 px-3 py-1 text-xs text-text3">
                {activeMatchLabel}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {teamMembers.map((member) => {
                const memberTheme = inferThemeCodeFromMemberTheme(member.theme);
                const memberIsExpected = memberTheme === activeTab;

                return (
                  <button
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      member.id === selectedMemberId
                        ? "border-brand/30 bg-brand/10 text-text1"
                        : "border-strokeSoft bg-surface2 text-text2 hover:bg-surface1"
                    }`}
                    key={member.id}
                    onClick={() => handleMemberSelection(member.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{member.name}</div>
                        <div className="mt-1 truncate text-xs text-text3">{member.role}</div>
                      </div>
                      {memberIsExpected ? (
                        <span className="rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-[11px] text-brand">
                          当前主题
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-text3">
                      <span className="rounded-full border border-strokeSoft bg-surface3 px-2 py-0.5">{member.theme}</span>
                      {member.signatureOp && member.signatureOp !== "待补充" ? (
                        <span className="rounded-full border border-strokeSoft bg-surface3 px-2 py-0.5">
                          招牌 {member.signatureOp}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-xl border px-4 py-3 text-sm ${getToolbarClasses(toolbar.tone)}`}>
            {toolbar.text}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-strokeSoft bg-surface3 px-4 py-3 text-sm text-text2 transition-colors hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canEditActiveSheet || actionLoading !== null}
              onClick={() => handleSave("draft")}
              type="button"
            >
              {actionLoading === "draft" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存草稿
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-brand transition-colors hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canEditActiveSheet || actionLoading !== null}
              onClick={() => handleSave("final")}
              type="button"
            >
              {actionLoading === "final" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              锁定成绩
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300 transition-colors hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPublish || actionLoading !== null}
              onClick={handlePublish}
              type="button"
            >
              {actionLoading === "publish" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              发布整队
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {(["team", "sami", "sarkaz", "sui"] as CalculatorTab[]).map((tab) => (
              <button
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-brand/25 bg-brand/10 text-brand"
                    : "border-strokeSoft bg-surface2 text-text2 hover:bg-surface3 hover:text-text1"
                }`}
                key={tab}
                onClick={() => handleTabChange(tab)}
                type="button"
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-strokeSoft bg-surface2 p-4 shadow-panel">
            <div className="flex flex-wrap items-center gap-3">
              {selectedMember ? (
                <span className="rounded-full border border-strokeSoft bg-surface3 px-3 py-1 text-xs text-text2">
                  选手主题：{selectedMember.theme}
                </span>
              ) : null}
              {activeTab !== "team" && expectedTheme ? (
                <span className={`rounded-full border px-3 py-1 text-xs ${expectedTheme === activeTab ? "border-brand/25 bg-brand/10 text-brand" : "border-live/25 bg-live/10 text-live"}`}>
                  应录主题：{THEME_LABELS[expectedTheme]}
                </span>
              ) : null}
              {activeTab !== "team" && hasUnsavedChanges ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                  未保存改动
                </span>
              ) : null}
              {sheetLoading ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-strokeSoft bg-surface3 px-3 py-1 text-xs text-text3">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  正在同步成绩单
                </span>
              ) : null}
              {activeTab !== "team" && expectedTheme && expectedTheme !== activeTab ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-live/25 bg-live/10 px-3 py-1 text-xs text-live transition-colors hover:bg-live/15"
                  onClick={() => handleTabChange(expectedTheme)}
                  type="button"
                >
                  切到正确主题
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {activeTab === "team" ? (
            <div className="space-y-6">
              <SectionCard
                description="汇总展示当前战队的原始总分、抗压加成、合规系数与最终总分。"
                onReset={() => setAggregateReloadToken((value) => value + 1)}
                title="战队聚合"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <MetricCard label="状态" value={teamAggregateStatus} />
                  <MetricCard
                    label="已录入"
                    value={aggregateForView ? `${aggregateForView.scoredCount} / ${aggregateForView.memberCount}` : "0 / 0"}
                  />
                  <MetricCard label="原始总分" value={aggregateForView?.formatted.rawTotal ?? "0.0"} />
                  <MetricCard label="抗压加成" value={aggregateForView?.formatted.pressureBonus ?? "0.0"} />
                  <MetricCard label="最终总分" value={aggregateForView?.formatted.finalTotal ?? "0.0"} />
                </div>
                <div className="mt-4 text-sm text-text3">
                  {aggregateLoading ? "正在同步最新聚合结果..." : "聚合结果会在录分、锁定和发布后即时刷新。"}
                </div>
              </SectionCard>

              <AlertList
                items={aggregateForView?.publishBlockingIssues ?? []}
                title="发布阻塞项"
                tone="danger"
              />
              <AlertList
                items={aggregateForView?.warnings ?? []}
                title="提醒项"
                tone="warning"
              />

              <SectionCard title="队员分数概览">
                {aggregateForView ? (
                  <div className="space-y-3">
                    {aggregateForView.members.map((member) => (
                      <div
                        className="flex flex-col gap-3 rounded-xl border border-strokeSoft bg-surface3 px-4 py-4 md:flex-row md:items-start md:justify-between"
                        key={member.memberId}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-text1">{member.name}</div>
                            {member.pressureApplied ? (
                              <span className="rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-xs text-brand">
                                抗压位
                              </span>
                            ) : null}
                            <span className="rounded-full border border-strokeSoft bg-surface2 px-2 py-0.5 text-xs text-text3">
                              {member.sheet?.status ? getSheetLabel(member.sheet.status) : "待录入"}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-text3">{member.expectedTheme}</div>
                          {member.sheet?.note ? (
                            <div className="mt-2 text-sm text-text2">备注：{member.sheet.note}</div>
                          ) : null}
                        </div>
                        <div className="text-left md:text-right">
                          <div className="text-lg font-semibold text-brand">{formatScore(member.adjustedScore)}</div>
                          <div className="mt-1 text-xs text-text3">原分 {formatScore(member.score)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-text3">请选择战队后查看成员录分结果。</div>
                )}
              </SectionCard>

              <SectionCard title="合规与系数">
                {aggregateForView ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <MetricCard label="抗压位" value={aggregateForView.compliance.roster.pressureMemberName ?? "未指定"} />
                    <MetricCard
                      label="共享源石锭"
                      value={`${aggregateForView.compliance.sharedIngots.spent} / ${aggregateForView.compliance.sharedIngots.limit}`}
                    />
                    <MetricCard
                      label="教练通话"
                      value={`${aggregateForView.compliance.coachCalls.totalCount} / ${aggregateForView.compliance.coachCalls.maxCount}`}
                    />
                    <MetricCard label="战队系数" value={formatScore(aggregateForView.coefficient)} />
                  </div>
                ) : (
                  <div className="text-sm text-text3">请选择战队后查看合规信息。</div>
                )}
              </SectionCard>
            </div>
          ) : null}

          {activeTab === "sami" ? (
            <div className="space-y-6">
              <SectionCard
                description={`已填写 ${samiSummary.base} 个基础输入项`}
                onReset={() => setSnapshots((current) => ({ ...current, sami: getDefaultThemeSnapshot("sami") }))}
                title="基础数据"
              >
                <div className="space-y-4">
                  {SAMI_BASE_ROWS.map((row, index) => (
                    <div className="grid gap-4 md:grid-cols-3" key={index}>
                      {row.map((field) => (
                        <NumberInput
                          field={field}
                          key={field.key}
                          onChange={(value) => updateSnapshotField("sami", field.key, value)}
                          value={Number(snapshots.sami[field.key] ?? 0)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard onReset={() => {
                updateSnapshotField("sami", "sa-gift", false);
                updateSnapshotField("sami", "sa-combo", false);
                updateSnapshotField("sami", "sa-gardener-nl", false);
                updateSnapshotField("sami", "sa-sentinel-nl", false);
                updateSnapshotField("sami", "sa-end-link", "0");
              }} description={`已勾选 ${samiSummary.specials} 项特殊判定`} title="特殊判定">
                <div className="grid gap-3 md:grid-cols-2">
                  {SAMI_SPECIAL_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sami[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sami", field.key, value)}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <SelectInput
                    field={SAMI_END_LINK_FIELD}
                    onChange={(value) => updateSnapshotField("sami", SAMI_END_LINK_FIELD.key, value)}
                    value={String(snapshots.sami[SAMI_END_LINK_FIELD.key] ?? "0")}
                  />
                </div>
              </SectionCard>

              <SectionCard onReset={() => {
                for (const field of SAMI_STAGE_FIELDS) {
                  updateSnapshotField("sami", field.key, false);
                }
              }} description={`已勾选 ${samiSummary.stages} 个关卡加分`} title="关卡加分">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {SAMI_STAGE_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sami[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sami", field.key, value)}
                    />
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : null}

          {activeTab === "sarkaz" ? (
            <div className="space-y-6">
              <SectionCard description={`已勾选 ${sarkazSummary.flags} 项关键状态`} onReset={() => {
                for (const field of SARKAZ_KEY_FIELDS) {
                  updateSnapshotField("sarkaz", field.key, false);
                }
              }} title="关键变量与惩罚">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {SARKAZ_KEY_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sarkaz[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sarkaz", field.key, value)}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard description={`已填写 ${sarkazSummary.base} 个基础输入项`} onReset={() => setSnapshots((current) => ({ ...current, sarkaz: { ...current.sarkaz, "sk-score": 0, "sk-items": 0, "sk-6s": 0, "sk-5s": 0, "sk-4s": 0 } }))} title="基础数据">
                <div className="space-y-4">
                  {SARKAZ_BASE_ROWS.map((row, index) => (
                    <div className={`grid gap-4 ${row.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`} key={index}>
                      {row.map((field) => (
                        <NumberInput
                          field={field}
                          key={field.key}
                          onChange={(value) => updateSnapshotField("sarkaz", field.key, value)}
                          value={Number(snapshots.sarkaz[field.key] ?? 0)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard onReset={() => {
                for (const field of SARKAZ_STAGE_FIELDS) {
                  updateSnapshotField("sarkaz", field.key, false);
                }
              }} description={`已勾选 ${sarkazSummary.stages} 个普通关卡`} title="普通关卡">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {SARKAZ_STAGE_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sarkaz[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sarkaz", field.key, value)}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                description="不容拒绝在持有羯磨时按“先加后乘”；主题最终统一乘以 0.75。"
                onReset={() => setSnapshots((current) => ({ ...current, sarkaz: getDefaultThemeSnapshot("sarkaz") }))}
                title="结局关逻辑"
              >
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                    <SelectInput
                      field={SARKAZ_RELIC_FIELD}
                      onChange={(value) => updateSnapshotField("sarkaz", SARKAZ_RELIC_FIELD.key, value)}
                      value={String(snapshots.sarkaz[SARKAZ_RELIC_FIELD.key] ?? "none")}
                    />
                    <div className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
                      <span className="mb-2 block text-xs text-text3">滚动先祖</span>
                      <CheckboxCard
                        checked={Boolean(snapshots.sarkaz[SARKAZ_ROLL_FIELD.key])}
                        field={SARKAZ_ROLL_FIELD}
                        onChange={(value) => updateSnapshotField("sarkaz", SARKAZ_ROLL_FIELD.key, value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {SARKAZ_ENDING_GROUPS.map((group) => (
                      <div className="rounded-xl border border-strokeSoft bg-surface3 p-4" key={group.title}>
                        <div className="mb-3 text-sm font-medium text-text1">{group.title}</div>
                        <div className="grid gap-3 md:grid-cols-3">
                          {group.fields.map((field) => (
                            <CheckboxCard
                              checked={Boolean(snapshots.sarkaz[field.key])}
                              field={field}
                              key={field.key}
                              onChange={(value) => updateSnapshotField("sarkaz", field.key, value)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {activeTab === "sui" ? (
            <div className="space-y-6">
              <SectionCard description={`已填写 ${suiSummary.base} 个基础输入项`} onReset={() => setSnapshots((current) => ({ ...current, sui: { ...current.sui, "sui-score": 0, "sui-items": 0, "sui-steps": 0, "sui-6s": 0, "sui-5s": 0, "sui-4s": 0, "sui-rule-violate": false } }))} title="基础数据">
                <div className="space-y-4">
                  {SUI_BASE_ROWS.map((row, index) => (
                    <div className="grid gap-4 md:grid-cols-3" key={index}>
                      {row.map((field) => (
                        <NumberInput
                          field={field}
                          key={field.key}
                          onChange={(value) => updateSnapshotField("sui", field.key, value)}
                          value={Number(snapshots.sui[field.key] ?? 0)}
                        />
                      ))}
                    </div>
                  ))}
                  <CheckboxCard
                    checked={Boolean(snapshots.sui[SUI_RULE_FIELD.key])}
                    field={SUI_RULE_FIELD}
                    onChange={(value) => updateSnapshotField("sui", SUI_RULE_FIELD.key, value)}
                  />
                </div>
              </SectionCard>

              <SectionCard onReset={() => {
                for (const field of SUI_MULTIPLIER_FIELDS) {
                  updateSnapshotField("sui", field.key, false);
                }
              }} description={`已勾选 ${suiSummary.multipliers} 项倍率条件`} title="全局倍率">
                <div className="grid gap-3 md:grid-cols-2">
                  {SUI_MULTIPLIER_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sui[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sui", field.key, value)}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard onReset={() => {
                for (const field of SUI_RELIC_FIELDS) {
                  updateSnapshotField("sui", field.key, false);
                }
              }} description={`已勾选 ${suiSummary.relics} 个关键藏品`} title="关键藏品状态">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {SUI_RELIC_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sui[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sui", field.key, value)}
                    />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                description="五结局通关时：忘生 +100、云与漆 +100、无封 +50。"
                onReset={() => {
                  updateSnapshotField("sui", SUI_ENDING_FIELD.key, "none");
                  updateSnapshotField("sui", SUI_ENDING_PERF_FIELD.key, false);
                  updateSnapshotField("sui", SUI_BEAST_LOSS_FIELD.key, "0");
                }}
                title="五结局作战"
              >
                <div className="space-y-4">
                  <SelectInput
                    field={SUI_ENDING_FIELD}
                    onChange={(value) => updateSnapshotField("sui", SUI_ENDING_FIELD.key, value)}
                    value={String(snapshots.sui[SUI_ENDING_FIELD.key] ?? "none")}
                  />
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
                    <CheckboxCard
                      checked={Boolean(snapshots.sui[SUI_ENDING_PERF_FIELD.key])}
                      field={SUI_ENDING_PERF_FIELD}
                      onChange={(value) => updateSnapshotField("sui", SUI_ENDING_PERF_FIELD.key, value)}
                    />
                    <SelectInput
                      field={SUI_BEAST_LOSS_FIELD}
                      onChange={(value) => updateSnapshotField("sui", SUI_BEAST_LOSS_FIELD.key, value)}
                      value={String(snapshots.sui[SUI_BEAST_LOSS_FIELD.key] ?? "0")}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard onReset={() => {
                for (const field of SUI_STAGE_FIELDS) {
                  updateSnapshotField("sui", field.key, false);
                }
              }} description={`已勾选 ${suiSummary.stages} 个关卡加分`} title="关卡加分">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {SUI_STAGE_FIELDS.map((field) => (
                    <CheckboxCard
                      checked={Boolean(snapshots.sui[field.key])}
                      field={field}
                      key={field.key}
                      onChange={(value) => updateSnapshotField("sui", field.key, value)}
                    />
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <SectionCard title="当前结果">
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-brand/70">Preview Score</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-4xl font-bold text-brand">{formatScore(preview.score)}</div>
                    {previewLoading ? <LoaderCircle className="h-5 w-5 animate-spin text-brand" /> : null}
                  </div>
                </div>
                <div className="rounded-xl border border-brand/20 bg-brand/10 p-3 text-brand">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-strokeSoft bg-surface3 px-4 py-3 font-mono text-sm leading-6 text-text2">
                {preview.formula}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] text-text3">Raw Score</div>
                  <div className="mt-2 text-lg font-semibold text-text1">
                    {preview.rawScore == null ? "—" : formatScore(preview.rawScore)}
                  </div>
                </div>
                <div className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] text-text3">Multiplier</div>
                  <div className="mt-2 text-lg font-semibold text-text1">
                    {preview.multiplier == null ? "—" : formatScore(preview.multiplier)}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-strokeSoft bg-surface3 px-4 py-3 text-sm text-text2 transition-colors hover:bg-surface2"
                  onClick={handleCopyScore}
                  type="button"
                >
                  <Clipboard className="h-4 w-4" />
                  复制分数
                </button>
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-live/20 bg-live/10 px-4 py-3 text-sm text-live transition-colors hover:bg-live/15"
                  onClick={resetCurrentTheme}
                  type="button"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {activeTab === "team" ? "刷新聚合" : "重置当前主题"}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="当前建议">
            <div className="rounded-2xl border border-strokeSoft bg-surface3 p-4">
              <div className="text-sm leading-7 text-text2">{activeThemeActionHint}</div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-strokeSoft bg-surface2 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] text-text3">成绩单状态</div>
                  <div className="mt-2 text-sm text-text1">{sheetView.label}</div>
                </div>
                <div className="rounded-xl border border-strokeSoft bg-surface2 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] text-text3">未保存改动</div>
                  <div className={`mt-2 text-sm ${hasUnsavedChanges ? "text-amber-300" : "text-text1"}`}>
                    {hasUnsavedChanges ? "有，需要保存或放弃" : "无"}
                  </div>
                </div>
                <div className="rounded-xl border border-strokeSoft bg-surface2 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.12em] text-text3">当前场次</div>
                  <div className="mt-2 text-sm text-text1">{activeMatchLabel}</div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="战队状态">
            {selectedTeam ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-strokeSoft bg-surface3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-text1">{selectedTeam.name}</div>
                      <div className="mt-1 text-sm text-text3">{selectedTeam.enName}</div>
                    </div>
                    <div className="rounded-lg border border-brand/20 bg-brand/10 px-3 py-2 text-sm text-brand">
                      #{selectedTeam.rank}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-lg border border-strokeSoft bg-surface2 px-3 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-text3">当前状态</div>
                      <div className="mt-2 inline-flex items-center gap-2 text-sm text-text1">
                        <Users className="h-4 w-4 text-brand" />
                        {teamAggregateStatus}
                      </div>
                    </div>
                    <div className="rounded-lg border border-strokeSoft bg-surface2 px-3 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-text3">可发布</div>
                      <div className="mt-2 inline-flex items-center gap-2 text-sm text-text1">
                        {aggregateForView?.publishReady ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            是
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-4 w-4 text-live" />
                            否
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-text1">发布条件</div>
                  {aggregateForView?.publishBlockingIssues.length ? (
                    aggregateForView.publishBlockingIssues.map((issue) => (
                      <div className="rounded-xl border border-live/20 bg-live/10 px-4 py-3 text-sm text-live" key={issue}>
                        {issue}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                      当前没有阻塞项，可以发布整队成绩。
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-text3">请选择战队后查看状态。</div>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
