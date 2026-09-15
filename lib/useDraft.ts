"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DraftMetadata<T> {
  data: T;
  savedAt: string; // ISO string
}

export function useDraft<T>(
  key: string,
  currentData: T,
  options: {
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { enabled = true, debounceMs = 400 } = options;

  // Initialize state lazily from localStorage to avoid cascading render in useEffect
  const [draftState, setDraftState] = useState<{
    hasDraft: boolean;
    data: T | null;
    savedAt: string | null;
    lastSavedText: string;
  }>(() => {
    if (typeof window === "undefined" || !key) {
      return { hasDraft: false, data: null, savedAt: null, lastSavedText: "" };
    }
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: DraftMetadata<T> = JSON.parse(stored);
        if (parsed && parsed.data) {
          const dateText = parsed.savedAt
            ? `Saved ${new Date(parsed.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "";
          return {
            hasDraft: true,
            data: parsed.data,
            savedAt: parsed.savedAt,
            lastSavedText: dateText,
          };
        }
      }
    } catch {}
    return { hasDraft: false, data: null, savedAt: null, lastSavedText: "" };
  });

  const isFirstMount = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced autosave
  useEffect(() => {
    if (typeof window === "undefined" || !key || !enabled) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const now = new Date();
        const payload: DraftMetadata<T> = {
          data: currentData,
          savedAt: now.toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(payload));
        setDraftState({
          hasDraft: true,
          data: currentData,
          savedAt: now.toISOString(),
          lastSavedText: `Saved ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        });
      } catch (err) {
        console.warn(`[useDraft] Error writing draft for key "${key}":`, err);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [key, currentData, enabled, debounceMs]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined" || !key) return;
    try {
      localStorage.removeItem(key);
      setDraftState({
        hasDraft: false,
        data: null,
        savedAt: null,
        lastSavedText: "",
      });
    } catch (err) {
      console.warn(`[useDraft] Error clearing draft for key "${key}":`, err);
    }
  }, [key]);

  return {
    hasDraft: draftState.hasDraft,
    draftData: draftState.data,
    draftSavedAt: draftState.savedAt,
    lastSavedText: draftState.lastSavedText,
    clearDraft,
  };
}
