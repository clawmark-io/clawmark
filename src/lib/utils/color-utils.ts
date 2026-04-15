/**
 * Convert an oklch() CSS color string to a hex color string.
 * Uses an off-screen canvas to let the browser do the conversion.
 */
export function oklchToHex(oklch: string): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#000000";
    ctx.fillStyle = oklch;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return "#000000";
  }
}

/**
 * Returns true if the oklch color string has lightness > 0.5 (i.e. a "light" color).
 * Used to determine color-scheme from a base background color.
 */
export function isLightOklch(oklch: string): boolean {
  const match = oklch.match(/oklch\(\s*([\d.]+)/);
  if (!match) return false;
  return parseFloat(match[1]) > 0.5;
}
