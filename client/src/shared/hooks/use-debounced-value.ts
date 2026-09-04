import { useDebounce } from "use-debounce";

const DEFAULT_DEBOUNCE_MS = 350;

/** Debounces a value for search/filter inputs. */
export function useDebouncedValue<T>(
  value: T,
  delayMs = DEFAULT_DEBOUNCE_MS
): T {
  const [debounced] = useDebounce(value, delayMs);
  return debounced;
}
