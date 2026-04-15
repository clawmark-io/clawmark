import { useState, useEffect, useCallback, useRef, type RefObject } from "react";
import type { Column } from "@/types/data-model";

type ScrollState = {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  clientHeight: number;
};

type KanbanMinimapProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  columns: Column[];
};

const MINIMAP_HEIGHT = 40;
const PADDING = 4;
const COLUMN_GAP = 2;
const MAX_MINIMAP_WIDTH = 300;

export function KanbanMinimap({ scrollContainerRef, columns }: KanbanMinimapProps) {
  const [scrollState, setScrollState] = useState<ScrollState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setScrollState({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
    });
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [scrollContainerRef, updateScrollState]);

  const scrollToPosition = useCallback(
    (clientX: number) => {
      const el = scrollContainerRef.current;
      const minimap = minimapRef.current;
      if (!el || !minimap || !scrollState) return;

      const rect = minimap.getBoundingClientRect();
      const relativeX = clientX - rect.left - PADDING;
      const innerWidth = rect.width - PADDING * 2;
      const ratio = Math.max(0, Math.min(1, relativeX / innerWidth));
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollLeft = ratio * maxScroll;
    },
    [scrollContainerRef, scrollState],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      scrollToPosition(e.clientX);
    },
    [scrollToPosition],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      scrollToPosition(e.clientX);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, scrollToPosition]);

  if (!scrollState || scrollState.clientHeight === 0 || scrollState.scrollWidth === 0 || columns.length === 0) return null;

  const hasOverflow = scrollState.scrollWidth > scrollState.clientWidth + 1;
  if (!hasOverflow) return null;

  const innerHeight = MINIMAP_HEIGHT - PADDING * 2;
  const scale = innerHeight / scrollState.clientHeight;

  const innerWidth = Math.min(scrollState.scrollWidth * scale, MAX_MINIMAP_WIDTH - PADDING * 2);
  const effectiveScale = innerWidth / scrollState.scrollWidth;
  const minimapWidth = innerWidth + PADDING * 2;

  const totalGaps = (columns.length - 1) * COLUMN_GAP;
  const columnWidth = (innerWidth - totalGaps) / columns.length;

  const viewportWidth = scrollState.clientWidth * effectiveScale;
  const viewportLeft = scrollState.scrollLeft * effectiveScale;

  return (
    <div
      ref={minimapRef}
      role="slider"
      aria-valuenow={scrollState ? Math.round((scrollState.scrollLeft / (scrollState.scrollWidth - scrollState.clientWidth)) * 100) : 0}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      className="absolute bottom-3 right-0 rounded-lg border border-base-content/10 bg-base-100/80 backdrop-blur-sm shadow-sm cursor-pointer select-none z-10"
      style={{ width: minimapWidth, height: MINIMAP_HEIGHT }}
      onMouseDown={handleMouseDown}
    >
      {/* Column rectangles */}
      <div
        className="absolute top-0 bottom-0 flex items-center"
        style={{
          left: PADDING,
          right: PADDING,
          gap: COLUMN_GAP,
        }}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="rounded-sm shrink-0 overflow-hidden flex flex-col border border-base-content/15"
            style={{
              width: columnWidth,
              height: innerHeight,
              backgroundColor: column.backgroundColor ?? "oklch(var(--b2))",
            }}
          >
            <div
              className="w-full shrink-0"
              style={{
                height: Math.max(Math.round(innerHeight * 0.15), 2),
                backgroundColor: column.color ?? "oklch(var(--bc) / 0.2)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Viewport indicator */}
      <div
        className="absolute rounded border-2 border-primary/50 bg-primary/10"
        style={{
          top: PADDING,
          height: innerHeight,
          left: PADDING + viewportLeft,
          width: Math.max(viewportWidth, 12),
        }}
      />
    </div>
  );
}
