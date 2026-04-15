import { Semaphore } from "./utils/semaphore.ts";
import { loadImageAsBlob } from "./utils/opfs.ts";
import { oklchToHex } from "./utils/color-utils.ts";
import type { Project, Task, Tag } from "@/types/data-model";
import { getFilesystemDriver } from "@/lib/workspace/drivers/runtime-driver";

type MemoryCacheEntry = { blobUrl: string; fingerprint: string };
const memoryCache = new Map<string, MemoryCacheEntry>();
const filesystem = getFilesystemDriver();

/**
 * This limits how many previews are generated at once.
 */
export const previewSemaphore = new Semaphore(1);

export function cheapHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function computeFingerprint(project: {
  updatedAt: number;
  backgroundVersion?: string;
  kanbanEnabled: boolean;
  backgroundBlur: number;
  backgroundSepia?: number;
  backgroundGrayscale?: number;
  backgroundOpacity?: number;
}, themeKey: string): string {
  return `${project.updatedAt}-${project.backgroundVersion ?? "none"}-${project.kanbanEnabled}-${project.backgroundBlur}-${project.backgroundSepia ?? 0}-${project.backgroundGrayscale ?? 0}-${project.backgroundOpacity ?? 100}-${themeKey}`;
}

function fingerprintKey(workspaceId: string, projectId: string): string {
  return `project-preview-${workspaceId}-${projectId}`;
}

export function getStoredFingerprint(workspaceId: string, projectId: string): string | null {
  return localStorage.getItem(fingerprintKey(workspaceId, projectId));
}

export function setStoredFingerprint(workspaceId: string, projectId: string, fp: string): void {
  localStorage.setItem(fingerprintKey(workspaceId, projectId), fp);
}

export function removeStoredFingerprint(workspaceId: string, projectId: string): void {
  localStorage.removeItem(fingerprintKey(workspaceId, projectId));
}

export function getMemoryCache(projectId: string): MemoryCacheEntry | undefined {
  return memoryCache.get(projectId);
}

export function setMemoryCache(projectId: string, entry: MemoryCacheEntry): void {
  memoryCache.set(projectId, entry);
}

export function clearMemoryCache(projectId: string): void {
  const entry = memoryCache.get(projectId);
  if (entry) {
    URL.revokeObjectURL(entry.blobUrl);
    memoryCache.delete(projectId);
  }
}

export async function savePreview(workspaceId: string, projectId: string, blob: Blob): Promise<void> {
  await filesystem.write(workspaceId, `previews/${projectId}`, blob);
}

export async function loadPreview(workspaceId: string, projectId: string): Promise<string | null> {
  const blob = await filesystem.read(workspaceId, `previews/${projectId}`);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function removePreview(workspaceId: string, projectId: string): Promise<void> {
  await filesystem.remove(workspaceId, `previews/${projectId}`);
  clearMemoryCache(projectId);
  removeStoredFingerprint(workspaceId, projectId);
}

async function loadThumbnail(workspaceId: string, bgVersion: string): Promise<string | null> {
  const blob = await filesystem.read(workspaceId, `thumbnails/${bgVersion}`);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

async function saveThumbnail(workspaceId: string, bgVersion: string, blob: Blob): Promise<void> {
  await filesystem.write(workspaceId, `thumbnails/${bgVersion}`, blob);
}

export async function getOrCreateThumbnail(
  workspaceId: string,
  bgVersion: string,
): Promise<string | null> {
  const cached = await loadThumbnail(workspaceId, bgVersion);
  if (cached) return cached;

  const fullBlob = await loadImageAsBlob(workspaceId, bgVersion);
  if (!fullBlob) return null;

  const bitmap = await createImageBitmap(fullBlob);
  const TARGET_WIDTH = 600;
  const scale = TARGET_WIDTH / bitmap.width;
  const targetHeight = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(TARGET_WIDTH, targetHeight);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, TARGET_WIDTH, targetHeight);
  bitmap.close();

  const thumbnailBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
  await saveThumbnail(workspaceId, bgVersion, thumbnailBlob);
  return URL.createObjectURL(thumbnailBlob);
}

// ── Resolve theme colors ──

/**
 * Resolve any CSS color (including oklch with alpha) to a canvas-compatible string.
 * Returns hex for opaque colors, rgba() for colors with alpha.
 * Uses the same canvas pixel-readback approach as oklchToHex.
 */
function resolveColor(cssValue: string): string {
  if (!cssValue) return "#000000";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#000000";
    ctx.fillStyle = cssValue;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 255) {
      return oklchToHex(cssValue);
    }
    return `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
  } catch {
    return "#000000";
  }
}

function getCssVar(name: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return resolveColor(raw);
}

export type ThemeColors = {
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;
  surfaceOverlay: string;
  borderSubtle: string;
  textMuted: string;
  neutral: string;
};

export function resolveThemeColors(): ThemeColors {
  return {
    base100: getCssVar("--color-base-100"),
    base200: getCssVar("--color-base-200"),
    base300: getCssVar("--color-base-300"),
    baseContent: getCssVar("--color-base-content"),
    surfaceOverlay: getCssVar("--surface-overlay"),
    borderSubtle: getCssVar("--border-subtle"),
    textMuted: getCssVar("--text-muted"),
    neutral: getCssVar("--color-neutral"),
  };
}

let contextSupportsFilter: boolean | null = null;

function supportsCtxFilter(): boolean {
  if (contextSupportsFilter !== null) return contextSupportsFilter;
  try {
    const c = new OffscreenCanvas(1, 1);
    const ctx = c.getContext("2d")!;
    // Browsers that support ctx.filter natively initialize it to "none".
    // Safari lacks the property entirely (undefined), but setting it
    // creates a plain JS property that round-trips — so we must check
    // the default value, not the round-trip.
    contextSupportsFilter = ctx.filter === "none";
  } catch {
    contextSupportsFilter = false;
  }
  return contextSupportsFilter;
}

function applyGrayscale(data: Uint8ClampedArray, amount: number) {
  const f = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = data[i] + (gray - data[i]) * f;
    data[i + 1] = data[i + 1] + (gray - data[i + 1]) * f;
    data[i + 2] = data[i + 2] + (gray - data[i + 2]) * f;
  }
}

function applySepia(data: Uint8ClampedArray, amount: number) {
  const f = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const sr = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
    const sg = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
    const sb = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    data[i] = r + (sr - r) * f;
    data[i + 1] = g + (sg - g) * f;
    data[i + 2] = b + (sb - b) * f;
  }
}

function applyBoxBlur(
  data: Uint8ClampedArray, w: number, h: number, radius: number,
) {
  if (radius < 1) return;
  const r = Math.round(radius);
  const tmp = new Uint8ClampedArray(data.length);
  for (let pass = 0; pass < 3; pass++) {
    const src = pass === 0 ? data : tmp;
    const dst = pass === 0 ? tmp : data;
    // Horizontal pass
    blurPass(src, dst, w, h, r, true);
    // Vertical pass
    blurPass(dst, src, w, h, r, false);
  }
  // After 3 passes (6 blurPass calls), result is in data
}

function blurPass(
  src: Uint8ClampedArray, dst: Uint8ClampedArray,
  w: number, h: number, r: number, horizontal: boolean,
) {
  const len = horizontal ? w : h;
  const stride = horizontal ? 4 : w * 4;
  const crossLen = horizontal ? h : w;
  const crossStride = horizontal ? w * 4 : 4;
  const diameter = r * 2 + 1;

  for (let cross = 0; cross < crossLen; cross++) {
    let ri = 0, gi = 0, bi = 0, ai = 0;
    const baseOff = cross * crossStride;

    // Seed the accumulator with the first (r+1) pixels
    for (let i = -r; i <= r; i++) {
      const ci = Math.max(0, Math.min(len - 1, i));
      const off = baseOff + ci * stride;
      ri += src[off]; gi += src[off + 1]; bi += src[off + 2]; ai += src[off + 3];
    }

    for (let i = 0; i < len; i++) {
      const off = baseOff + i * stride;
      dst[off] = (ri / diameter) | 0;
      dst[off + 1] = (gi / diameter) | 0;
      dst[off + 2] = (bi / diameter) | 0;
      dst[off + 3] = (ai / diameter) | 0;

      // Slide window
      const addIdx = Math.min(len - 1, i + r + 1);
      const remIdx = Math.max(0, i - r);
      const addOff = baseOff + addIdx * stride;
      const remOff = baseOff + remIdx * stride;
      ri += src[addOff] - src[remOff];
      gi += src[addOff + 1] - src[remOff + 1];
      bi += src[addOff + 2] - src[remOff + 2];
      ai += src[addOff + 3] - src[remOff + 3];
    }
  }
}

const CANVAS_W = 480;
const CANVAS_H = 300;
const MAX_TAGS = 20;

function drawRoundedRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawRoundedRectStroke(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawKanbanPreview(
  ctx: OffscreenCanvasRenderingContext2D,
  project: Project,
  colors: ThemeColors,
) {
  const columns = [...project.columns]
    .filter((c) => !c.hiddenOnKanban)
    .toSorted((a, b) => a.sortOrder - b.sortOrder);

  const tasks = Object.values(project.tasks).filter((t) => !t.archived);
  const tasksByColumn = new Map<string, Task[]>();
  for (const col of columns) {
    tasksByColumn.set(col.id, []);
  }
  for (const task of tasks) {
    if (task.columnId && tasksByColumn.has(task.columnId)) {
      tasksByColumn.get(task.columnId)!.push(task);
    }
  }
  for (const [colId, colTasks] of tasksByColumn) {
    tasksByColumn.set(colId, colTasks.toSorted((a, b) => a.sortOrder - b.sortOrder));
  }

  const padding = 8;
  const colGap = 5;
  const headerH = 22;
  const baseCardH = 22;
  const cardGap = 3;
  const tags = project.tags ?? [];

  const MAX_COLUMNS = 4;
  const innerW = CANVAS_W - padding * 2;
  const colWidth = Math.floor((innerW - (MAX_COLUMNS - 1) * colGap) / MAX_COLUMNS);
  const tagAreaW = colWidth - 8 - 8; // card padding on each side
  const tagWidthMap = measureAllTagWidths(ctx, tags);

  let x = padding;
  for (const column of columns.slice(0, MAX_COLUMNS)) {
    const colTasks = tasksByColumn.get(column.id) ?? [];

    let totalCardsH = 0;
    for (const task of colTasks) {
      const resolved = resolveTaskTags(task, tags);
      const widths = getTagWidths(resolved, tagWidthMap);
      totalCardsH += calcCardHeightFromTagWidths(baseCardH, widths, tagAreaW) + cardGap;
    }
    const colHeight = headerH + 4 + totalCardsH + 4;

    // Column background
    ctx.fillStyle = column.backgroundColor
      ? resolveColor(column.backgroundColor)
      : colors.base200;
    drawRoundedRect(ctx, x, padding, colWidth, Math.min(colHeight, CANVAS_H - padding * 2), 6);

    // Column border
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    drawRoundedRectStroke(ctx, x, padding, colWidth, Math.min(colHeight, CANVAS_H - padding * 2), 6);

    // Header
    let hx = x + 6;
    if (column.color) {
      ctx.fillStyle = resolveColor(column.color);
      drawRoundedRect(ctx, hx, padding + 6, 3, 10, 1);
      hx += 7;
    }
    ctx.fillStyle = colors.baseContent;
    ctx.font = "bold 8px -apple-system, sans-serif";
    ctx.fillText(column.title, hx, padding + 14, colWidth - 30);

    // Task count
    ctx.fillStyle = colors.textMuted;
    ctx.font = "7px -apple-system, sans-serif";
    ctx.fillText(String(colTasks.length), x + colWidth - 16, padding + 14);

    // Header bottom border
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.moveTo(x, padding + headerH);
    ctx.lineTo(x + colWidth, padding + headerH);
    ctx.stroke();

    // Cards
    let cy = padding + headerH + 4;
    for (const task of colTasks) {
      const resolved = resolveTaskTags(task, tags);
      const widths = getTagWidths(resolved, tagWidthMap);
      const dynCardH = calcCardHeightFromTagWidths(baseCardH, widths, tagAreaW);
      if (cy + dynCardH > CANVAS_H - padding) break;
      drawCard(ctx, x + 4, cy, colWidth - 8, dynCardH, task, tags, tagWidthMap, colors);
      cy += dynCardH + cardGap;
    }

    x += colWidth + colGap;
  }
}

const TAG_H = 6;
const TAG_GAP = 3;
const TAG_PAD_X = 4; // horizontal padding inside each tag pill
const TAG_ROW_H = TAG_H + 3;
const TAG_FONT = "5px -apple-system, sans-serif";

function resolveTaskTags(task: Task, tags: Tag[]): Tag[] {
  return task.tags
    .map((id) => tags.find((t) => t.id === id))
    .filter((t) => t !== undefined)
    .slice(0, MAX_TAGS);
}

function measureAllTagWidths(ctx: OffscreenCanvasRenderingContext2D, tags: Tag[]): Map<string, number> {
  ctx.font = TAG_FONT;
  const map = new Map<string, number>();
  for (const t of tags) {
    map.set(t.id, ctx.measureText(t.label).width + TAG_PAD_X * 2);
  }
  return map;
}

function getTagWidths(resolvedTags: Tag[], widthMap: Map<string, number>): number[] {
  return resolvedTags.map((t) => widthMap.get(t.id) ?? 14);
}

function calcTagRows(tagWidths: number[], availableW: number): number {
  if (tagWidths.length === 0) return 0;
  let rows = 1;
  let x = 0;
  for (const w of tagWidths) {
    if (x > 0 && x + TAG_GAP + w > availableW) {
      rows++;
      x = w;
    } else {
      x += (x > 0 ? TAG_GAP : 0) + w;
    }
  }
  return rows;
}

function calcCardHeightFromTagWidths(baseH: number, tagWidths: number[], availableW: number): number {
  const rows = calcTagRows(tagWidths, availableW);
  if (rows <= 1) return baseH;
  return baseH + (rows - 1) * TAG_ROW_H;
}

function drawWrappedTags(
  ctx: OffscreenCanvasRenderingContext2D,
  resolvedTags: Tag[], widths: number[],
  startX: number, startY: number, availableW: number,
  textColor: string, neutralColor: string,
) {
  let tx = startX;
  let ty = startY;
  for (let i = 0; i < resolvedTags.length; i++) {
    const w = widths[i];
    if (tx > startX && tx - startX + TAG_GAP + w > availableW) {
      tx = startX;
      ty += TAG_ROW_H;
    } else if (tx > startX) {
      tx += TAG_GAP;
    }
    ctx.fillStyle = resolvedTags[i].color ? resolveColor(resolvedTags[i].color) : neutralColor;
    drawRoundedRect(ctx, tx, ty, w, TAG_H, 3);
    ctx.fillStyle = textColor;
    ctx.font = TAG_FONT;
    ctx.fillText(resolvedTags[i].label, tx + TAG_PAD_X, ty + TAG_H - 1.5, w - TAG_PAD_X * 2);
    tx += w;
  }
}

function drawWrappedTagsRightAligned(
  ctx: OffscreenCanvasRenderingContext2D,
  resolvedTags: Tag[], widths: number[],
  startY: number, padding: number, rowInnerW: number, availableW: number,
  textColor: string, neutralColor: string,
) {
  // Split tags into rows based on available width
  const rows: { tags: Tag[]; widths: number[] }[] = [{ tags: [], widths: [] }];
  let rowX = 0;
  for (let i = 0; i < resolvedTags.length; i++) {
    const w = widths[i];
    if (rowX > 0 && rowX + TAG_GAP + w > availableW) {
      rows.push({ tags: [], widths: [] });
      rowX = w;
    } else {
      rowX += (rowX > 0 ? TAG_GAP : 0) + w;
    }
    const row = rows[rows.length - 1];
    row.tags.push(resolvedTags[i]);
    row.widths.push(w);
  }

  let ty = startY;
  for (const row of rows) {
    const totalW = row.widths.reduce((a, b) => a + b, 0) + (row.widths.length - 1) * TAG_GAP;
    let tx = padding + rowInnerW - 8 - totalW;
    for (let j = 0; j < row.tags.length; j++) {
      const w = row.widths[j];
      ctx.fillStyle = row.tags[j].color ? resolveColor(row.tags[j].color) : neutralColor;
      drawRoundedRect(ctx, tx, ty, w, TAG_H, 3);
      ctx.fillStyle = textColor;
      ctx.font = TAG_FONT;
      ctx.fillText(row.tags[j].label, tx + TAG_PAD_X, ty + TAG_H - 1.5, w - TAG_PAD_X * 2);
      tx += w + TAG_GAP;
    }
    ty += TAG_ROW_H;
  }
}

function drawCard(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  task: Task, tags: Tag[], tagWidthMap: Map<string, number>, colors: ThemeColors,
) {
  // Card background
  ctx.fillStyle = task.color ? resolveColor(task.color) : colors.surfaceOverlay;
  drawRoundedRect(ctx, x, y, w, h, 4);

  // Card border
  ctx.strokeStyle = colors.borderSubtle;
  ctx.lineWidth = 0.5;
  drawRoundedRectStroke(ctx, x, y, w, h, 4);

  // Title
  ctx.fillStyle = task.color ? "#fff" : colors.baseContent;
  ctx.globalAlpha = task.completed ? 0.5 : 1;
  ctx.font = "7px -apple-system, sans-serif";
  ctx.fillText(task.title, x + 4, y + 9, w - 8);
  ctx.globalAlpha = 1;

  // Tags (wrapping)
  const resolvedTags = resolveTaskTags(task, tags);
  if (resolvedTags.length > 0) {
    const tagAreaW = w - 8;
    const widths = getTagWidths(resolvedTags, tagWidthMap);
    const textColor = task.color ? "rgba(255,255,255,0.9)" : colors.baseContent;
    drawWrappedTags(ctx, resolvedTags, widths, x + 4, y + 14, tagAreaW, textColor, colors.neutral);
  }
}

function drawTasksListPreview(
  ctx: OffscreenCanvasRenderingContext2D,
  project: Project,
  colors: ThemeColors,
) {
  const tasks = Object.values(project.tasks)
    .filter((t) => !t.archived)
    .toSorted((a, b) => a.sortOrder - b.sortOrder);

  const padding = 8;
  const baseRowH = 24;
  const rowGap = 3;
  const tags = project.tags ?? [];
  const rowInnerW = CANVAS_W - padding * 2;
  const tagAreaW = rowInnerW / 2; // tags get right half of the row
  const tagWidthMap = measureAllTagWidths(ctx, tags);

  let y = padding;
  for (const task of tasks) {
    const resolvedTags = resolveTaskTags(task, tags);
    const widths = getTagWidths(resolvedTags, tagWidthMap);
    const dynRowH = calcCardHeightFromTagWidths(baseRowH, widths, tagAreaW);
    if (y + dynRowH > CANVAS_H - padding) break;

    // Row background
    ctx.fillStyle = task.color ? resolveColor(task.color) : colors.base300;
    drawRoundedRect(ctx, padding, y, rowInnerW, dynRowH, 4);

    // Row border
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 0.5;
    drawRoundedRectStroke(ctx, padding, y, rowInnerW, dynRowH, 4);

    // Checkbox circle
    const cx = padding + 12;
    const cy = y + baseRowH / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    if (task.completed) {
      ctx.fillStyle = task.color ? "#fff" : colors.baseContent;
      ctx.fill();
    } else {
      ctx.strokeStyle = task.color ? "rgba(255,255,255,0.4)" : colors.textMuted;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = task.color ? "#fff" : colors.baseContent;
    ctx.globalAlpha = task.completed ? 0.5 : 1;
    ctx.font = "8px -apple-system, sans-serif";
    ctx.fillText(task.title, padding + 24, y + 14, rowInnerW - 60);
    ctx.globalAlpha = 1;

    // Tags (wrapping, right-aligned)
    if (resolvedTags.length > 0) {
      const textColor = task.color ? "rgba(255,255,255,0.9)" : colors.baseContent;
      drawWrappedTagsRightAligned(ctx, resolvedTags, widths, y + 10, padding, rowInnerW, tagAreaW, textColor, colors.neutral);
    }

    y += dynRowH + rowGap;
  }
}

function drawImageCover(
  ctx: OffscreenCanvasRenderingContext2D,
  bitmap: ImageBitmap,
  canvasW: number,
  canvasH: number,
) {
  const scale = Math.max(canvasW / bitmap.width, canvasH / bitmap.height);
  const scaledW = bitmap.width * scale;
  const scaledH = bitmap.height * scale;
  const x = (canvasW - scaledW) / 2;
  const y = (canvasH - scaledH) / 2;
  ctx.drawImage(bitmap, x, y, scaledW, scaledH);
}

export async function renderPreview(
  project: Project,
  thumbnailBlobUrl: string | null,
): Promise<Blob | null> {
  const colors = resolveThemeColors();
  const canvas = new OffscreenCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = colors.base100;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Background image + filters
  if (thumbnailBlobUrl) {
    try {
      const response = await fetch(thumbnailBlobUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      const blur = project.backgroundBlur;
      const sepia = project.backgroundSepia ?? 0;
      const grayscale = project.backgroundGrayscale ?? 0;
      const opacity = (project.backgroundOpacity ?? 100) / 100;
      const hasFilters = blur > 0 || sepia > 0 || grayscale > 0;

      if (hasFilters && supportsCtxFilter()) {
        // Chrome / Firefox — native ctx.filter
        const parts: string[] = [];
        if (blur > 0) parts.push(`blur(${blur}px)`);
        if (sepia > 0) parts.push(`sepia(${sepia}%)`);
        if (grayscale > 0) parts.push(`grayscale(${grayscale}%)`);
        ctx.globalAlpha = opacity;
        ctx.filter = parts.join(" ");
        drawImageCover(ctx, bitmap, CANVAS_W, CANVAS_H);
        ctx.filter = "none";
        ctx.globalAlpha = 1;
      } else if (hasFilters) {
        // Safari fallback — manual pixel manipulation
        ctx.globalAlpha = opacity;
        drawImageCover(ctx, bitmap, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;
        const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        if (blur > 0) applyBoxBlur(imageData.data, CANVAS_W, CANVAS_H, blur);
        if (sepia > 0) applySepia(imageData.data, sepia);
        if (grayscale > 0) applyGrayscale(imageData.data, grayscale);
        ctx.putImageData(imageData, 0, 0);
      } else {
        // No filters — just draw with opacity
        ctx.globalAlpha = opacity;
        drawImageCover(ctx, bitmap, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;
      }
      bitmap.close();
    } catch {
      // Thumbnail load failed, continue without background
    }
  }

  // Draw content
  if (project.kanbanEnabled) {
    drawKanbanPreview(ctx, project, colors);
  } else {
    drawTasksListPreview(ctx, project, colors);
  }

  return canvas.convertToBlob({ type: "image/png" });
}
