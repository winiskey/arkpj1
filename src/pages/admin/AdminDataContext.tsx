/* ─── Admin data context ───────────────────────────────────────────── */
/* Fetches the admin bootstrap payload ONCE in AdminLayout, caches it, */
/* and provides a `refresh()` method for child components to refetch   */
/* after mutations.                                                    */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from "react";
import { useNavigate } from "react-router-dom";
import type { AdminBootstrap } from "./types";
import { AdminApiError, fetchBootstrap, getAdminToken } from "./useAdminApi";

interface AdminDataContextValue {
    data: AdminBootstrap | null;
    loading: boolean;
    error: string | null;
    /** Re-fetch the bootstrap payload from the server. */
    refresh: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue>({
    data: null,
    loading: true,
    error: null,
    refresh: async () => { },
});

export function AdminDataProvider({ children }: PropsWithChildren) {
    const navigate = useNavigate();
    const [data, setData] = useState<AdminBootstrap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        // Guard: redirect to login if no token present
        if (!getAdminToken()) {
            navigate("/admin/login", { replace: true });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = await fetchBootstrap();
            setData(payload);
        } catch (err) {
            if (err instanceof AdminApiError && err.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setError(err instanceof Error ? err.message : "加载管理数据失败");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        load();
    }, [load]);

    const value = useMemo(
        () => ({ data, loading, error, refresh: load }),
        [data, loading, error, load],
    );

    return (
        <AdminDataContext.Provider value={value}>
            {children}
        </AdminDataContext.Provider>
    );
}

/** Consume the admin bootstrap data cached by AdminDataProvider. */
export function useAdminData() {
    return useContext(AdminDataContext);
}
