import { useDebounce } from "use-debounce";

/** Debounces a value for search/filter inputs (default 350ms). */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced] = useDebounce(value, delayMs);
  return debounced;
}
