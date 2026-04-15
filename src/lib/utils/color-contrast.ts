import Color from "color";

/**
 * Compute relative luminance of a hex color using the WCAG formula.
 * Returns a value between 0 (black) and 1 (white).
 */
function toLinear(c: number) {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Returns true if the background color is dark (light text needed).
 */
export function isDarkBackground(hex: string): boolean {
  // return getLuminance(hex) <= 0.179;
  return new Color(hex).isDark();
}

/**
 * Derives a border color from a background color.
 * Darkens light backgrounds and lightens dark backgrounds for visible contrast.
 */
export function getBorderColor(hex: string): string {
  const color = new Color(hex);
  // return color.isDark()
  //   ? color.lighten(0.15).hex()
  //   : color.darken(0.25).hex();
  // return color.lighten(0.15);
  // return 'rgba(255, 255, 255, .2)';
  if (color.isDark()) {
    return color.whiten(.5).hex();
  }
  return color.lighten(.2).hex();

}
