import { Theme } from '@mui/material/styles';
import dcCalculatorTheme from './dcCalculatorTheme';
import mixologyTheme from './mixologyTheme';

export type ThemeName = 'mixology' | 'dc-calculator';

export const themeMap: Record<ThemeName, Theme> = {
  mixology: mixologyTheme,
  'dc-calculator': dcCalculatorTheme,
};

export const themeLabels: Record<ThemeName, string> = {
  mixology: 'Mixology',
  'dc-calculator': 'DC Calculator',
};

export { dcCalculatorTheme, mixologyTheme };
