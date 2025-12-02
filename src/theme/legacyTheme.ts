import { createTheme } from '@mui/material/styles';

const legacyTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f1c0f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4b5563',
    },
    background: {
      default: '#f3f4f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#c62828',
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default legacyTheme;
