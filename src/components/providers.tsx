"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { FIXTURE_OPPORTUNITIES } from "@/lib/fixtures";
import type { Opportunity, SavedOpportunity, StudentProfile } from "@/lib/types";

const STORAGE = {
  profile: "talentatrack:profile",
  saved: "talentatrack:saved",
  opportunities: "talentatrack:opportunities",
};
const CHANGE_EVENT = "talentatrack:local-data-change";

interface AppContextValue {
  hydrated: boolean;
  profile: StudentProfile | null;
  opportunities: Opportunity[];
  saved: SavedOpportunity[];
  setProfile: (profile: StudentProfile) => void;
  setReminder: (opportunityId: string, enabled: boolean) => void;
  toggleSaved: (opportunityId: string) => void;
  saveOpportunity: (opportunity: Opportunity) => void;
  deleteOpportunity: (id: string) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function readSnapshot(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSnapshot(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // The app still works for the current visit if browser storage is unavailable.
  }
}

function removeSnapshot(key: string) {
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // The app still works for the current visit if browser storage is unavailable.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const profileRaw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(STORAGE.profile),
    () => null,
  );
  const savedRaw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(STORAGE.saved),
    () => null,
  );
  const opportunitiesRaw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(STORAGE.opportunities),
    () => null,
  );
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const profile = parseJson<StudentProfile | null>(profileRaw, null);
  const saved = parseJson<SavedOpportunity[]>(savedRaw, []);
  const opportunities = parseJson<Opportunity[]>(
    opportunitiesRaw,
    FIXTURE_OPPORTUNITIES,
  );

  const setProfile = useCallback((nextProfile: StudentProfile) => {
    writeSnapshot(STORAGE.profile, nextProfile);
  }, []);

  const toggleSaved = useCallback((opportunityId: string) => {
    const current = parseJson<SavedOpportunity[]>(readSnapshot(STORAGE.saved), []);
    const exists = current.some((item) => item.opportunityId === opportunityId);
    const next = exists
      ? current.filter((item) => item.opportunityId !== opportunityId)
      : [
          {
            opportunityId,
            savedAt: new Date().toISOString(),
            reminderEnabled: true,
          },
          ...current,
        ];
    writeSnapshot(STORAGE.saved, next);
  }, []);

  const setReminder = useCallback(
    (opportunityId: string, enabled: boolean) => {
      const current = parseJson<SavedOpportunity[]>(readSnapshot(STORAGE.saved), []);
      writeSnapshot(
        STORAGE.saved,
        current.map((item) =>
          item.opportunityId === opportunityId
            ? { ...item, reminderEnabled: enabled }
            : item,
        ),
      );
    },
    [],
  );

  const saveOpportunity = useCallback((opportunity: Opportunity) => {
    const current = parseJson<Opportunity[]>(
      readSnapshot(STORAGE.opportunities),
      FIXTURE_OPPORTUNITIES,
    );
    const exists = current.some((item) => item.id === opportunity.id);
    const next = exists
      ? current.map((item) => (item.id === opportunity.id ? opportunity : item))
      : [opportunity, ...current];
    writeSnapshot(STORAGE.opportunities, next);
  }, []);

  const deleteOpportunity = useCallback((id: string) => {
    const current = parseJson<Opportunity[]>(
      readSnapshot(STORAGE.opportunities),
      FIXTURE_OPPORTUNITIES,
    );
    writeSnapshot(
      STORAGE.opportunities,
      current.filter((item) => item.id !== id),
    );
  }, []);

  const resetDemo = useCallback(() => {
    removeSnapshot(STORAGE.profile);
    removeSnapshot(STORAGE.saved);
    removeSnapshot(STORAGE.opportunities);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      profile,
      opportunities,
      saved,
      setProfile,
      setReminder,
      toggleSaved,
      saveOpportunity,
      deleteOpportunity,
      resetDemo,
    }),
    [
      hydrated,
      profile,
      opportunities,
      saved,
      setProfile,
      setReminder,
      toggleSaved,
      saveOpportunity,
      deleteOpportunity,
      resetDemo,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
