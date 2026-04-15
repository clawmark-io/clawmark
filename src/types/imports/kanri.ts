/**
 * Kanri workspace data types
 */

export interface KanriCard {
  id: string;
  name: string;
  description?: string;
}

export interface KanriColumn {
  id: string;
  title: string;
  cards: KanriCard[];
}

export interface KanriBackground {
  blur: string;
  brightness: string;
  src: string;
}

export interface KanriBoard {
  id: string;
  title: string;
  lastEdited: string;
  columns: KanriColumn[];
  background?: KanriBackground;
}

export interface KanriColors {
  accent: string;
  accentDarker: string;
  bgPrimary: string;
  elevation1: string;
  elevation2: string;
  elevation3: string;
  text: string;
  textButtons: string;
  textD1: string;
  textD2: string;
  textD3: string;
  textD4: string;
}

export interface KanriWorkspace {
  activeTheme: string;
  boardSortingOption: string;
  boards: KanriBoard[];
  colors: KanriColors;
  columnZoomLevel: number;
  lastInstalledVersion: string;
}

