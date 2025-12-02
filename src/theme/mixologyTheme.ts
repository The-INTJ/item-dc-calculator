import { createTheme } from '@mui/material/styles';

const mixologyTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6a4d39',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4f6e8a',
    },
    background: {
      default: '#627890',
      paper: '#ffffff',
    },
    text: {
      primary: '#101010',
      secondary: '#2f2f2f',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#c62828',
    },
  },
  shape: {
    borderRadius: 10,
  },
});

export default mixologyTheme;
