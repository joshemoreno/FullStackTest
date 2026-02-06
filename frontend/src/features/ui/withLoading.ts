import type { AppDispatch } from "../../app/store";
import { startLoading, stopLoading } from "./uiSlice";

export async function withLoading<T>(
  dispatch: AppDispatch,
  fn: () => Promise<T>
): Promise<T> {
  dispatch(startLoading());
  try {
    return await fn();
  } finally {
    dispatch(stopLoading());
  }
}
