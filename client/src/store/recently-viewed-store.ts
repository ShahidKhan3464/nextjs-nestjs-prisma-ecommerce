import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX = 10;

interface RecentlyViewedState {
  slugs: string[];
  recordView: (slug: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      slugs: [],
      recordView: (slug) => {
        const rest = get().slugs.filter((s) => s !== slug);
        set({ slugs: [slug, ...rest].slice(0, MAX) });
      },
    }),
    { name: "recently-viewed-storage" }
  )
);
