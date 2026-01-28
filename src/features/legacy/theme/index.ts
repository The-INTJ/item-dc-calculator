import { Theme } from '@mui/material/styles';
import legacyTheme from './legacyTheme';
import mixologyTheme from './mixologyTheme';

export type ThemeName = 'mixology' | 'legacy';

export const themeMap: Record<ThemeName, Theme> = {
  mixology: mixologyTheme,
  legacy: legacyTheme,
};

export const themeLabels: Record<ThemeName, string> = {
  mixology: 'Mixology',
  legacy: 'DC Calculator',
};

export { legacyTheme, mixologyTheme };
