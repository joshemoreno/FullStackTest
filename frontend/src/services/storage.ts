/* eslint-disable @typescript-eslint/no-explicit-any */
const KEY = "wompi_front_state_v1";

export type PersistedState = {
  checkout?: any;
  transaction?: any;
};

export function loadState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : undefined;
  } catch {
    return undefined;
  }
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
