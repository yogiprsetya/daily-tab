export type ThemeSetting = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'comfortable';

export type Settings = {
  id: 'global';
  theme: ThemeSetting;
  density: Density;
  createdAt: number;
  updatedAt: number;
};

export type LayoutState = {
  leftPanelWidth: number;
  topWidgetHeight: number;
  rightPanelHeight: number;
};
