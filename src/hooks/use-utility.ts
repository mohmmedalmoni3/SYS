"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * useDebouncedSearch — controlled query with a debounced mirror value,
 * ideal for command palette and list filtering.
 *
 * @example
 * const { query, setQuery, debounced, isPending } = useDebouncedSearch(220);
 * const filtered = useMemo(() => items.filter(i => i.title.includes(debounced)), [debounced]);
 */
export function useDebouncedSearch(delay = 250) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (query === debounced) return;
    setIsPending(true);
    const timer = setTimeout(() => {
      setDebounced(query);
      setIsPending(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [query, delay, debounced]);

  return { query, setQuery, debounced, isPending, reset: () => setQuery("") };
}

/** useMediaQuery — SSR-safe media query subscription. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

/**
 * useClipboard — copy text with a transient "copied" flag.
 *
 * @example
 * const { copy, copied } = useClipboard();
 * <button onClick={() => copy(inviteLink)}>{copied ? "تم النسخ" : "نسخ الرابط"}</button>
 */
export function useClipboard(timeout = 1600) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const area = document.createElement("textarea");
        area.value = value;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    },
    [timeout],
  );
  return { copied, copy };
}

/** useIdleDetector — flags a user as idle after N ms without interaction. */
export function useIdleDetector(timeoutMs = 60_000) {
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      setIdle(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setIdle(true), timeoutMs);
    };
    const events = ["pointermove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((event) => window.removeEventListener(event, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [timeoutMs]);

  return { idle, wake: () => setIdle(false) };
}

/**
 * useLocalDraft — autosaves form values to localStorage and restores them
 * after a refresh/crash.
 *
 * @example
 * const draft = useLocalDraft("proposal-draft", { title: "", body: "" });
 * <input value={draft.value.title} onChange={e => draft.setValue({ ...draft.value, title: e.target.value })} />
 */
export function useLocalDraft<T>(key: string, initial: T, delay = 600) {
  const [value, setValue] = useState<T>(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
        setRestored(true);
      }
    } catch {
      /* ignore corrupted drafts */
    }
  }, [key]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setSavedAt(Date.now());
      } catch {
        /* storage full */
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [key, value, delay]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initial);
    setSavedAt(null);
    setRestored(false);
  }, [key, initial]);

  return { value, setValue, savedAt, restored, clear };
}

/** useUndoRedo — small history stack for editors and optimistic boards. */
export function useUndoRedo<T>(initial: T) {
  const [history, setHistory] = useState<{ past: T[]; present: T; future: T[] }>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((next: T) => {
    setHistory((state) => ({
      past: [...state.past.slice(-40), state.present],
      present: next,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    });
  }, []);

  return {
    value: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

/** useInfiniteList — client-side paging for long demo collections. */
export function useInfiniteList<T>(items: T[], pageSize = 12) {
  const [page, setPage] = useState(1);
  const visible = useMemo(() => items.slice(0, page * pageSize), [items, page, pageSize]);
  const hasMore = visible.length < items.length;
  return {
    visible,
    hasMore,
    loadMore: () => setPage((current) => current + 1),
    reset: () => setPage(1),
  };
}

/**
 * useOptimisticMutation — TanStack mutation with optimistic cache update and
 * automatic rollback on failure.
 *
 * @example
 * const vote = useOptimisticMutation({
 *   mutationFn: castVote,
 *   queryKey: ["proposals"],
 *   optimisticUpdate: (old, variables) => applyVote(old, variables),
 * });
 */
export function useOptimisticMutation<TData, TVariables, TCache = unknown>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  onSuccess,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  optimisticUpdate: (old: TCache | undefined, variables: TVariables) => TCache | undefined;
  onSuccess?: (data: TData) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<TData, Error, TVariables, { previous: TCache | undefined }>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TCache>(queryKey);
      queryClient.setQueryData<TCache>(queryKey, (old) => optimisticUpdate(old, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (data) => onSuccess?.(data),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
