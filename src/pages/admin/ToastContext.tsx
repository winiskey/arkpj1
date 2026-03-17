/* ─── Global Toast Notification System ─────────────────────────────── */
/* Lightweight, framework-agnostic toast with auto-dismiss.            */
/* Usage: toast.success("保存成功")  toast.error("操作失败")           */

import { createContext, useCallback, useContext, useState, type PropsWithChildren } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
    success: () => { },
    error: () => { },
    warning: () => { },
    info: () => { },
});

let nextId = 0;

export function ToastProvider({ children }: PropsWithChildren) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value: ToastContextValue = {
        success: (msg) => addToast("success", msg),
        error: (msg) => addToast("error", msg),
        warning: (msg) => addToast("warning", msg),
        info: (msg) => addToast("info", msg),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast Container — fixed bottom-right */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}

// ── Toast Card ─────────────────────────────────────────────────────

const STYLE_MAP: Record<ToastType, { icon: typeof CheckCircle; border: string; bgClass: string; textClass: string }> = {
    success: { icon: CheckCircle, border: "border-green-500/30", bgClass: "bg-green-500/10", textClass: "text-green-400" },
    error: { icon: XCircle, border: "border-live/30", bgClass: "bg-live/10", textClass: "text-live" },
    warning: { icon: AlertTriangle, border: "border-amber-500/30", bgClass: "bg-amber-500/10", textClass: "text-amber-400" },
    info: { icon: Info, border: "border-brand/30", bgClass: "bg-brand/10", textClass: "text-brand" },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    const style = STYLE_MAP[toast.type];
    const Icon = style.icon;

    return (
        <div
            className={`pointer-events-auto flex w-96 items-start gap-3 rounded-xl border ${style.border} ${style.bgClass} p-4 shadow-xl backdrop-blur-sm animate-in slide-in-from-right-full duration-300`}
        >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.textClass}`} />
            <p className="flex-1 text-sm text-text1">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-text3 transition-colors hover:text-text1"
                aria-label="关闭通知"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
