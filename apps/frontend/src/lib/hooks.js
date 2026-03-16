/**
 * Centralized SWR data hooks.
 * - First visit: shows skeleton while fetching.
 * - Return visit: shows cached data instantly, revalidates in background.
 * - keepPreviousData: true → no blank flash on filter/page changes.
 */
import useSWR, { mutate as swrMutate } from "swr";
import { api } from "./api";

// ── Cache invalidators ───────────────────────────────────────────────────────

export const invalidateChurches  = () => swrMutate((k) => Array.isArray(k) && k[0] === "churches");
export const invalidatePastors   = () => swrMutate((k) => Array.isArray(k) && k[0] === "pastors");
export const invalidateEvents    = () => swrMutate("events");
export const invalidateDashboard = () => swrMutate("dashboard");
export const invalidateUsers     = () => swrMutate("users");

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useChurches({ page = 1, limit = 50, search = "" } = {}) {
  const { data, error, isLoading, isValidating } = useSWR(
    ["churches", page, limit, search],
    () => api.listChurches({ page, limit, ...(search ? { search } : {}) }),
    { keepPreviousData: true }
  );
  return {
    churches:     data?.data ?? [],
    total:        data?.total ?? 0,
    isLoading,
    isValidating,
    error:        error?.message ?? null,
  };
}

export function useAllChurches() {
  const { data, isLoading } = useSWR("churches/all", api.listAllChurches);
  return { churches: data ?? [], isLoading };
}

export function usePastors({ page = 1, limit = 50, search = "", status = "" } = {}) {
  const { data, error, isLoading, isValidating } = useSWR(
    ["pastors", page, limit, search, status],
    () => api.listPastors({ page, limit, ...(search ? { search } : {}), ...(status ? { status } : {}) }),
    { keepPreviousData: true }
  );
  return {
    pastors:      data?.data ?? [],
    total:        data?.total ?? 0,
    isLoading,
    isValidating,
    error:        error?.message ?? null,
  };
}

export function useEvents() {
  const { data, error, isLoading } = useSWR("events", api.listEvents);
  return { events: data ?? [], isLoading, error: error?.message ?? null };
}

export function useDashboard() {
  const { data, error, isLoading } = useSWR("dashboard", api.getDashboardSummary);
  return { data, isLoading, error: error?.message ?? null };
}

export function useUsers() {
  const { data, error, isLoading } = useSWR("users", api.listUsers);
  return { users: data ?? [], isLoading, error: error?.message ?? null };
}
