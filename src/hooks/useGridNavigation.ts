import { useCallback, useEffect, useRef, useState } from 'react';

interface GridNavigationOptions {
  /**
   * Whether to wrap around when reaching the end/start
   * @default true
   */
  wrap?: boolean;

  /**
   * Whether to automatically focus the first item on mount
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Callback when focused index changes
   */
  onFocusChange?: (index: number) => void;

  /**
   * Callback when Enter is pressed on focused item
   */
  onActivate?: (index: number) => void;
}

interface GridLayout {
  rows: number[][];
  positions: DOMRect[];
}

/**
 * Hook for managing keyboard navigation in a grid layout
 * Handles arrow key navigation with dynamic grid size calculation
 */
export function useGridNavigation(itemCount: number, options: GridNavigationOptions = {}) {
  const { wrap = true, autoFocus = false, onFocusChange, onActivate } = options;

  const [focusedIndex, setFocusedIndex] = useState<number>(autoFocus ? 0 : -1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutCache = useRef<GridLayout | null>(null);

  // Initialize refs array
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  /**
   * Calculate grid layout based on actual DOM positions
   */
  const calculateGridLayout = useCallback((): GridLayout => {
    const positions = itemRefs.current
      .map(el => el?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => rect !== undefined);

    if (positions.length === 0) {
      return { rows: [], positions: [] };
    }

    // Group items by rows based on Y position (with 5px tolerance)
    const rows: number[][] = [];
    const sortedIndices = positions
      .map((_, index) => index)
      .toSorted((a, b) => {
        const rectA = positions[a];
        const rectB = positions[b];
        // Sort by Y first, then X
        if (Math.abs(rectA.top - rectB.top) < 5) {
          return rectA.left - rectB.left;
        }
        return rectA.top - rectB.top;
      });

    let currentRow: number[] = [];
    let currentY: number | null = null;

    for (const index of sortedIndices) {
      const rect = positions[index];

      if (currentY === null || Math.abs(rect.top - currentY) < 5) {
        // Same row
        currentRow.push(index);
        currentY = rect.top;
      } else {
        // New row
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [index];
        currentY = rect.top;
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return { rows, positions };
  }, []);

  /**
   * Refresh layout cache
   */
  const refreshLayout = useCallback(() => {
    layoutCache.current = calculateGridLayout();
  }, [calculateGridLayout]);

  /**
   * Find the index of an item in the grid layout
   */
  const findInGrid = useCallback((index: number, layout: GridLayout): { row: number; col: number } | null => {
    for (let rowIndex = 0; rowIndex < layout.rows.length; rowIndex++) {
      const colIndex = layout.rows[rowIndex].indexOf(index);
      if (colIndex !== -1) {
        return { row: rowIndex, col: colIndex };
      }
    }
    return null;
  }, []);

  /**
   * Navigate to adjacent item
   */
  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (focusedIndex === -1 && itemCount > 0) {
      // No focus yet, focus first item
      setFocusedIndex(0);
      return;
    }

    const layout = layoutCache.current || calculateGridLayout();
    const currentPos = findInGrid(focusedIndex, layout);

    if (!currentPos) return;

    let newIndex = focusedIndex;

    switch (direction) {
      case 'left': {
        if (currentPos.col > 0) {
          // Move left in same row
          newIndex = layout.rows[currentPos.row][currentPos.col - 1];
        } else if (wrap && currentPos.row > 0) {
          // Wrap to end of previous row
          const prevRow = layout.rows[currentPos.row - 1];
          newIndex = prevRow[prevRow.length - 1];
        } else if (wrap) {
          // Wrap to end of last row
          const lastRow = layout.rows[layout.rows.length - 1];
          newIndex = lastRow[lastRow.length - 1];
        }
        break;
      }

      case 'right': {
        const currentRow = layout.rows[currentPos.row];
        if (currentPos.col < currentRow.length - 1) {
          // Move right in same row
          newIndex = currentRow[currentPos.col + 1];
        } else if (wrap && currentPos.row < layout.rows.length - 1) {
          // Wrap to start of next row
          newIndex = layout.rows[currentPos.row + 1][0];
        } else if (wrap) {
          // Wrap to start of first row
          newIndex = layout.rows[0][0];
        }
        break;
      }

      case 'up': {
        if (currentPos.row > 0) {
          // Move to previous row, find closest item horizontally
          const targetRow = layout.rows[currentPos.row - 1];
          const currentX = layout.positions[focusedIndex].left;

          // Find item in target row closest to current X position
          let closestIndex = targetRow[0];
          let closestDistance = Math.abs(layout.positions[closestIndex].left - currentX);

          for (const itemIndex of targetRow) {
            const distance = Math.abs(layout.positions[itemIndex].left - currentX);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = itemIndex;
            }
          }

          newIndex = closestIndex;
        } else if (wrap) {
          // Wrap to last row, same column or closest
          const lastRow = layout.rows[layout.rows.length - 1];
          const targetCol = Math.min(currentPos.col, lastRow.length - 1);
          newIndex = lastRow[targetCol];
        }
        break;
      }

      case 'down': {
        if (currentPos.row < layout.rows.length - 1) {
          // Move to next row, find closest item horizontally
          const targetRow = layout.rows[currentPos.row + 1];
          const currentX = layout.positions[focusedIndex].left;

          // Find item in target row closest to current X position
          let closestIndex = targetRow[0];
          let closestDistance = Math.abs(layout.positions[closestIndex].left - currentX);

          for (const itemIndex of targetRow) {
            const distance = Math.abs(layout.positions[itemIndex].left - currentX);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = itemIndex;
            }
          }

          newIndex = closestIndex;
        } else if (wrap) {
          // Wrap to first row, same column or closest
          const firstRow = layout.rows[0];
          const targetCol = Math.min(currentPos.col, firstRow.length - 1);
          newIndex = firstRow[targetCol];
        }
        break;
      }
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
    }
  }, [focusedIndex, itemCount, wrap, calculateGridLayout, findInGrid]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        navigate('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        navigate('down');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        navigate('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        navigate('right');
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex !== -1) {
          onActivate?.(focusedIndex);
        }
        break;
    }
  }, [navigate, focusedIndex, onActivate]);

  /**
   * Sync DOM focus with focused index
   */
  useEffect(() => {
    if (focusedIndex !== -1 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
      onFocusChange?.(focusedIndex);
    }
  }, [focusedIndex, onFocusChange]);

  /**
   * Setup keyboard event listener
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * Refresh layout on window resize
   */
  useEffect(() => {
    const handleResize = () => {
      refreshLayout();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [refreshLayout]);

  /**
   * Refresh layout when item count changes
   */
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      refreshLayout();
    }, 0);

    return () => clearTimeout(timer);
  }, [itemCount, refreshLayout]);

  /**
   * Auto-focus first item on mount if enabled
   */
  useEffect(() => {
    if (autoFocus && itemCount > 0 && focusedIndex === -1) {
      setFocusedIndex(0);
    }
  }, [autoFocus, itemCount, focusedIndex]);

  /**
   * Focus container on mount to enable keyboard navigation
   */
  useEffect(() => {
    if (containerRef.current && itemCount > 0) {
      containerRef.current.focus();
    }
  }, [itemCount]);

  /**
   * Get ref callback for an item
   */
  const getItemRef = useCallback((index: number) => {
    return (element: HTMLElement | null) => {
      itemRefs.current[index] = element;
    };
  }, []);

  /**
   * Get props for an item
   */
  const getItemProps = useCallback((index: number, onClick?: () => void) => {
    return {
      ref: getItemRef(index),
      tabIndex: focusedIndex === index ? 0 : -1,
      'data-focused': focusedIndex === index,
      onClick: () => {
        setFocusedIndex(index);
        onClick?.();
      },
    };
  }, [focusedIndex, getItemRef]);

  /**
   * Get props for the container
   */
  const getContainerProps = useCallback(() => {
    return {
      ref: containerRef,
      tabIndex: -1,
    };
  }, []);

  /**
   * Manually set focused index
   */
  const setFocus = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setFocusedIndex(index);
    }
  }, [itemCount]);

  /**
   * Clear focus
   */
  const clearFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  /**
   * Focus the container (useful for restoring focus after modal closes)
   */
  const focusContainer = useCallback(() => {
    containerRef.current?.focus();
  }, []);

  return {
    focusedIndex,
    setFocus,
    clearFocus,
    focusContainer,
    getItemProps,
    getContainerProps,
    refreshLayout,
  };
}
