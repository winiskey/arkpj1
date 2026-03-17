import { AlertTriangle, Check, ChevronDown, History, Search, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { sixStarOperatorCatalog, normalizeOperatorName } from "./operatorCatalog";
import type { OperatorCatalogEntry } from "./types";

interface OperatorComboboxProps {
  value: OperatorCatalogEntry | null;
  onChange: (entry: OperatorCatalogEntry | null) => void;
  existingSelections: Map<string, string[]>;
  selectedNames?: Set<string>;
  disabled?: boolean;
  placeholder?: string;
  clearAfterSelect?: boolean;
  keepOpenOnSelect?: boolean;
}

interface OperatorAvatarProps {
  entry?: OperatorCatalogEntry | null;
  name: string;
  dimmed?: boolean;
  sizeClassName?: string;
  badge?: ReactNode;
}

const MAX_RESULTS = 28;
const RECENT_OPERATORS_STORAGE_KEY = "admin.recent-six-star-operators";
const MAX_RECENT_OPERATORS = 6;

function buildSelectionMeta(existingSelections: Map<string, string[]>, operatorName: string) {
  const existingMembers = existingSelections.get(normalizeOperatorName(operatorName)) ?? [];
  return {
    existingMembers,
    isExisting: existingMembers.length > 0,
  };
}

export function OperatorAvatar({
  entry,
  name,
  dimmed = false,
  sizeClassName = "h-11 w-11",
  badge,
}: OperatorAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0) || "?";
  const imageUrl = !failed ? entry?.avatarUrl : null;

  useEffect(() => {
    setFailed(false);
  }, [entry?.avatarUrl]);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(214,192,138,0.18),transparent_64%),linear-gradient(180deg,rgba(36,41,49,0.96),rgba(18,20,24,0.96))]",
        sizeClassName,
      ].join(" ")}
    >
      {imageUrl ? (
        <img
          alt={name}
          className={[
            "h-full w-full object-cover transition-[filter,opacity,transform] duration-[220ms] ease-[var(--ease-out)]",
            dimmed ? "grayscale saturate-0 opacity-70" : "opacity-100",
          ].join(" ")}
          loading="lazy"
          onError={() => setFailed(true)}
          src={imageUrl}
        />
      ) : (
        <div
          className={[
            "flex h-full w-full items-center justify-center font-display text-base font-bold tracking-[0.08em] text-brand",
            dimmed ? "grayscale opacity-70" : "",
          ].join(" ")}
        >
          {initial}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_38%)]" />

      {badge ? (
        <div className="pointer-events-none absolute right-1 top-1 z-10">
          {badge}
        </div>
      ) : null}
    </div>
  );
}

export function OperatorCombobox({
  value,
  onChange,
  existingSelections,
  selectedNames,
  disabled = false,
  placeholder = "搜索六星干员",
  clearAfterSelect = false,
  keepOpenOnSelect = false,
}: OperatorComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = "operator-combobox-listbox";
  const [query, setQuery] = useState(value?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [recentOperatorIds, setRecentOperatorIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_OPERATORS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentOperatorIds(parsed.filter((entry): entry is string => typeof entry === "string"));
      }
    } catch {
      // Ignore invalid local storage state and start with an empty recent list.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(RECENT_OPERATORS_STORAGE_KEY, JSON.stringify(recentOperatorIds));
    } catch {
      // Ignore local storage write failures.
    }
  }, [recentOperatorIds]);

  useEffect(() => {
    if (!isOpen) {
      setQuery(value?.name ?? "");
    }
  }, [isOpen, value?.name]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
      setQuery(value?.name ?? "");
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, value?.name]);

  const normalizedQuery = normalizeOperatorName(query);

  const filteredOptions = useMemo(() => {
    const base = normalizedQuery
      ? sixStarOperatorCatalog.filter((entry) => entry.searchText.includes(normalizedQuery))
      : sixStarOperatorCatalog;

    return base.slice(0, MAX_RESULTS);
  }, [normalizedQuery]);

  const recentEntries = useMemo(() => {
    const catalogById = new Map(sixStarOperatorCatalog.map((entry) => [entry.id, entry]));

    return recentOperatorIds
      .map((id) => catalogById.get(id) ?? null)
      .filter((entry): entry is OperatorCatalogEntry => Boolean(entry));
  }, [recentOperatorIds]);

  useEffect(() => {
    if (!filteredOptions.length) {
      setHighlightedIndex(0);
      return;
    }

    setHighlightedIndex((current) => Math.min(current, filteredOptions.length - 1));
  }, [filteredOptions]);

  const highlightedOptionId = filteredOptions[highlightedIndex]
    ? `operator-option-${filteredOptions[highlightedIndex].id}`
    : undefined;

  useEffect(() => {
    if (!isOpen || !highlightedOptionId) {
      return;
    }

    document.getElementById(highlightedOptionId)?.scrollIntoView({ block: "nearest" });
  }, [highlightedOptionId, isOpen]);

  const handleSelect = (entry: OperatorCatalogEntry) => {
    onChange(entry);
    setQuery(clearAfterSelect ? "" : entry.name);
    setIsOpen(keepOpenOnSelect);
    setHighlightedIndex(0);
    setRecentOperatorIds((current) => [entry.id, ...current.filter((id) => id !== entry.id)].slice(0, MAX_RECENT_OPERATORS));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }

    if (!isOpen) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const entry = filteredOptions[highlightedIndex];
      if (entry) {
        handleSelect(entry);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setQuery(value?.name ?? "");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={[
          "interactive-surface flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2 transition-[border-color,box-shadow,background-color] duration-[220ms]",
          disabled
            ? "cursor-not-allowed border-white/6 bg-surface3/40 opacity-60"
            : "border-strokeSoft bg-surface3/95 focus-within:border-brand/50 focus-within:shadow-[0_0_0_1px_rgba(214,192,138,0.38),0_18px_36px_-28px_rgba(214,192,138,0.42)]",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center">
          {value ? (
            <OperatorAvatar entry={value} name={value.name} sizeClassName="h-10 w-10" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-text3">
              <Search className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-activedescendant={highlightedOptionId}
            aria-label="搜索六星干员"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-text1 outline-none placeholder:text-text3"
            disabled={disabled}
            onChange={(event) => {
              const nextValue = event.target.value;
              setQuery(nextValue);
              setIsOpen(true);
              if (!nextValue.trim()) {
                onChange(null);
              } else if (value && normalizeOperatorName(nextValue) !== normalizeOperatorName(value.name)) {
                onChange(null);
              }
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={inputRef}
            role="combobox"
            type="text"
            value={query}
          />
          <div className="mt-1 flex items-center gap-2 text-[11px] text-text3">
            <span>仅显示六星候选</span>
            {recentEntries.length ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5">
                <History className="h-3 w-3" />
                最近 {recentEntries.length} 项
              </span>
            ) : null}
            {value ? <span className="text-brand">已选中 {value.name}</span> : null}
          </div>
        </div>

        {value || query ? (
          <button
            aria-label="清空当前干员选择"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-text2 transition-colors hover:border-white/15 hover:text-text1"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setQuery("");
              setIsOpen(false);
              setHighlightedIndex(0);
              inputRef.current?.focus();
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <button
          aria-label="展开六星干员列表"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-text2 transition-colors hover:border-brand/30 hover:text-brand"
          disabled={disabled}
          onClick={() => {
            if (disabled) {
              return;
            }

            inputRef.current?.focus();
            setIsOpen((current) => !current);
          }}
          type="button"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-[180ms] ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-30 overflow-hidden rounded-[26px] border border-brand/20 bg-[linear-gradient(180deg,rgba(23,27,32,0.98),rgba(14,16,20,0.98))] shadow-[0_22px_50px_-26px_rgba(0,0,0,0.95)] animate-[panel-enter_220ms_var(--ease-out)]"
          role="presentation"
        >
          <div
            className="max-h-[22rem] overflow-y-auto p-2"
            id={listboxId}
            role="listbox"
          >
            {!normalizedQuery && recentEntries.length ? (
              <div className="mb-2 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text3">
                  <History className="h-3.5 w-3.5" />
                  最近使用
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentEntries.map((entry) => {
                    const { existingMembers, isExisting } = buildSelectionMeta(existingSelections, entry.name);
                    const isPicked = selectedNames?.has(normalizeOperatorName(entry.name)) ?? false;

                    return (
                      <button
                        className={[
                          "interactive-surface inline-flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-left transition-all duration-[180ms]",
                          isPicked
                            ? "cursor-default border-brand/25 bg-brand/10 text-brand"
                            : isExisting
                              ? "border-live/20 bg-live/10 text-live"
                              : "border-white/8 bg-white/[0.03] text-text2 hover:border-brand/25 hover:text-text1",
                        ].join(" ")}
                        disabled={isPicked}
                        key={entry.id}
                        onClick={() => handleSelect(entry)}
                        type="button"
                      >
                        <OperatorAvatar
                          dimmed={isExisting || isPicked}
                          entry={entry}
                          name={entry.name}
                          sizeClassName="h-9 w-9"
                        />
                        <span className="max-w-[7rem] truncate text-xs font-medium">
                          {entry.name}
                          {isPicked ? " (本次已选)" : isExisting ? ` (${existingMembers.length})` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {filteredOptions.length ? (
              filteredOptions.map((entry, index) => {
                const { existingMembers, isExisting } = buildSelectionMeta(existingSelections, entry.name);
                const isActive = highlightedIndex === index;
                const isSelected = value?.id === entry.id;
                const isPicked = selectedNames?.has(normalizeOperatorName(entry.name)) ?? false;
                const hint = isPicked
                  ? "已加入本次待提交"
                  : isExisting
                    ? `已被 ${existingMembers.join("、")} 选择`
                    : "可直接录入";

                return (
                  <button
                    aria-selected={isSelected}
                    className={[
                      "interactive-surface flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-[180ms]",
                      isPicked
                        ? "cursor-default border-brand/25 bg-brand/10"
                        : isActive
                          ? "border-brand/40 bg-brand/10 shadow-[0_10px_24px_-20px_rgba(214,192,138,0.7)]"
                          : "border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.03]",
                    ].join(" ")}
                    disabled={isPicked}
                    id={`operator-option-${entry.id}`}
                    key={entry.id}
                    onClick={() => handleSelect(entry)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    type="button"
                  >
                    <OperatorAvatar
                      badge={
                        isPicked ? (
                          <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : isExisting ? (
                          <span className="inline-flex items-center rounded-full border border-live/40 bg-live/15 px-1.5 py-0.5 text-[10px] font-semibold text-live">
                            <AlertTriangle className="h-3 w-3" />
                          </span>
                        ) : undefined
                      }
                      dimmed={isExisting || isPicked}
                      entry={entry}
                      name={entry.name}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "truncate text-sm font-semibold",
                            isPicked ? "text-brand" : isExisting ? "text-text2" : "text-text1",
                          ].join(" ")}
                        >
                          {entry.name}
                        </span>
                        <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-[0.16em] text-brand">
                          6-Star
                        </span>
                        {isSelected ? <Check className="h-4 w-4 text-brand" /> : null}
                      </div>
                      <div className={`mt-1 text-[11px] ${isExisting && !isPicked ? "text-live" : "text-text3"}`}>
                        {hint}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-text3">
                没有找到匹配的六星干员
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
