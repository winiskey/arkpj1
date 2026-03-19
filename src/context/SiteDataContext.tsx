import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import {
  eventSchedule,
  judgeNotices,
  leaderboard,
  liveBroadcast,
  matches,
  overviewPanels,
  ruleSections,
  siteMeta,
  teams,
  themeRules,
  type LeaderboardEntry,
  type LiveBroadcastMeta,
  type Match,
  type RuleSection,
  type ScheduleDay,
  type SiteMeta,
  type Team,
  type TeamMemberOperatorPick,
  type ThemeRule,
} from "../content";


export interface OverviewPanel {
  title: string;
  label: string;
  content: string;
}

export interface SiteDataBootstrap {
  siteMeta: SiteMeta;
  overviewPanels: OverviewPanel[];
  liveBroadcast: LiveBroadcastMeta;
  matches: Match[];
  eventSchedule: ScheduleDay[];
  leaderboard: LeaderboardEntry[];
  judgeNotices: string[];
  teams: Team[];
  ruleSections: RuleSection[];
  themeRules: ThemeRule[];
}

interface SiteDataContextValue {
  data: SiteDataBootstrap;
  loading: boolean;
  source: "static" | "api";
  error: string | null;
}

const staticSiteData: SiteDataBootstrap = {
  siteMeta,
  overviewPanels,
  liveBroadcast,
  matches,
  eventSchedule,
  leaderboard,
  judgeNotices,
  teams,
  ruleSections,
  themeRules,
};

const SiteDataContext = createContext<SiteDataContextValue>({
  data: staticSiteData,
  loading: false,
  source: "static",
  error: null,
});

export function SiteDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<SiteDataBootstrap>(staticSiteData);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"static" | "api">("static");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchBootstrap = async () => {
      try {
        const response = await fetch("/api/public/bootstrap");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as SiteDataBootstrap;
        if (!isActive) {
          return;
        }

        setData(payload);
        setSource("api");
        setError(null);
      } catch (fetchError) {
        if (!isActive) {
          return;
        }

        setSource("static");
        setError(fetchError instanceof Error ? fetchError.message : "加载后端数据失败");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchBootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  // WebSocket: live data updates
  useEffect(() => {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProto}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { event: string; data: unknown };

          if (msg.event === "picks:updated") {
            const { teamId, memberId, operatorPicks } = msg.data as {
              teamId: string;
              memberId: string;
              operatorPicks: TeamMemberOperatorPick[];
            };
            setData((prev) => ({
              ...prev,
              teams: prev.teams.map((team) =>
                team.id === teamId
                  ? {
                    ...team,
                    members: team.members.map((member) =>
                      member.id === memberId ? { ...member, operatorPicks } : member,
                    ),
                  }
                  : team,
              ),
            }));
          }

          if (msg.event === "live:updated") {
            const liveBroadcast = msg.data as LiveBroadcastMeta;
            setData((prev) => ({ ...prev, liveBroadcast }));
          }

          if (msg.event === "match:updated") {
            const updatedMatch = msg.data as Match;
            setData((prev) => ({
              ...prev,
              matches: prev.matches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)),
            }));
          }

          if (msg.event === "team:updated") {
            // Full content replaced — re-fetch
            fetch("/api/public/bootstrap")
              .then((res) => res.json())
              .then((payload: SiteDataBootstrap) => setData(payload))
              .catch(() => { });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (active) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const value = useMemo(
    () => ({ data, loading, source, error }),
    [data, error, loading, source],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
