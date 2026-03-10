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

  const value = useMemo(
    () => ({ data, loading, source, error }),
    [data, error, loading, source],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
