import { create } from "zustand";
import { persist } from "zustand/middleware";

type EmojiUsageState = {
  usage: Record<string, number>;
  incrementUsage: (emoji: string) => void;
  getFrequent: (limit: number) => string[];
};

export const useEmojiUsageStore = create<EmojiUsageState>()(
  persist(
    (set, get) => ({
      usage: {},
      incrementUsage: (emoji) =>
        set((state) => ({
          usage: {
            ...state.usage,
            [emoji]: (state.usage[emoji] ?? 0) + 1,
          },
        })),
      getFrequent: (limit) => {
        const { usage } = get();
        return Object.entries(usage)
          .toSorted((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([emoji]) => emoji);
      },
    }),
    { name: "kanri-emoji-usage" }
  )
);
