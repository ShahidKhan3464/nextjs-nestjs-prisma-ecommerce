import { AsyncLocalStorage } from 'async_hooks';
import { UserRole } from 'src/common/enums/user-role.enum';

export type RequestContextStore = {
  requestId?: string;
  ip?: string;
  userId?: number;
  roles?: UserRole[];
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(
  store: RequestContextStore,
  fn: () => T,
): T {
  return storage.run(store, fn);
}

export function getRequestContext(): RequestContextStore {
  return storage.getStore() ?? {};
}

export function patchRequestContext(patch: Partial<RequestContextStore>): void {
  const current = storage.getStore();
  if (!current) {
    return;
  }
  Object.assign(current, patch);
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
