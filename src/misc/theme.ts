import { createTheme } from '@mui/material/styles';

const commonOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)',
        transition: 'background 0.15s, box-shadow 0.15s',
        '&:hover': {
          boxShadow: '0 4px 16px 0 rgba(37,99,235,0.16)',
        },
        '&:active': {
          boxShadow: '0 1px 4px 0 rgba(37,99,235,0.10)',
        },
        '&:focus-visible': {
          outline: '2px solid #2563eb',
          outlineOffset: 2,
        },
      } as any,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 2,
        boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
        transition: 'box-shadow 0.15s, transform 0.15s',
        padding: '6px',
        marginBottom: '4px',
        animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          boxShadow: '0 8px 32px 0 rgba(30,41,59,0.16)',
          transform: 'translateY(-0.5px) scale(1.002)',
        },
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        borderRadius: 2,
        background: 'inherit',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 0 0 2px rgba(37,99,235,0.10)',
        },
        '&.Mui-focused': {
          boxShadow: '0 0 0 2px #2563eb',
          borderColor: '#2563eb',
        },
      },
    },
  },
};

const fontFamily = [
  'Inter',
  'Roboto',
  'Segoe UI',
  'Arial',
  'sans-serif',
].join(', ');

const globalTypography = {
  fontFamily,
  h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.01562em' },
  h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.00833em' },
  h3: { fontWeight: 600, fontSize: '1.5rem' },
  h4: { fontWeight: 600, fontSize: '1.25rem' },
  h5: { fontWeight: 500, fontSize: '1.1rem' },
  h6: { fontWeight: 500, fontSize: '1rem' },
  body1: { fontSize: '1rem', fontWeight: 400 },
  body2: { fontSize: '0.95rem', fontWeight: 400 },
  button: { fontWeight: 600, textTransform: 'none' as const },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb', contrastText: '#fff' },
    secondary: { main: '#f59e42', contrastText: '#fff' },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    background: { default: '#f5f7fa', paper: '#fff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
  },
  shape: {
    borderRadius: 5,
  },
  spacing: 10,
  typography: globalTypography,
  components: {
    ...commonOverrides,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily,
          backgroundColor: '#f5f7fa',
          color: '#1e293b',
        },
        a: {
          color: '#2563eb',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        },
        // Custom scrollbars for Webkit browsers
        '::-webkit-scrollbar': {
          width: '5px',
          background: '#e0e7ef',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#b6c2d6',
          borderRadius: '8px',
          border: '2px solid #e0e7ef',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#2563eb',
        },
        // Fade-in animation for cards/lists
        '@global': {
          '@keyframes fadeInCard': {
            '0%': { opacity: 0, transform: 'translateY(2px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          ...commonOverrides.MuiInputBase.styleOverrides.root,
          background: '#fff',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 24px 0 rgba(30,41,59,0.12)',
          minWidth: 320,
          maxWidth: 420,
          fontWeight: 500,
          fontSize: '1rem',
          letterSpacing: 0.1,
          animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
          fontWeight: 600,
          fontSize: '1rem',
          alignItems: 'center',
          padding: '10px 18px',
          minWidth: 320,
          maxWidth: 420,
          animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)',
        },
        standardSuccess: {
          backgroundColor: '#e8f7ee',
          color: '#22c55e',
          border: '1.5px solid #22c55e',
        },
        standardError: {
          backgroundColor: '#fbeaea',
          color: '#ef4444',
          border: '1.5px solid #ef4444',
        },
        standardInfo: {
          backgroundColor: '#eaf1fb',
          color: '#2563eb',
          border: '1.5px solid #2563eb',
        },
        standardWarning: {
          backgroundColor: '#fff7e6',
          color: '#f59e42',
          border: '1.5px solid #f59e42',
        },
        icon: {
          fontSize: 24,
          marginRight: 10,
        },
        message: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 8px 32px 0 rgba(30,41,59,0.18)',
          animation: 'fadeInCard 0.25s cubic-bezier(0.4,0,0.2,1)',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa', contrastText: '#181f2a' },
    secondary: { main: '#fbbf24', contrastText: '#181f2a' },
    success: { main: '#4ade80' },
    error: { main: '#f87171' },
    background: { default: '#181f2a', paper: '#232e3c' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
  shape: {
    borderRadius: 5,
  },
  spacing: 10,
  typography: globalTypography,
  components: {
    ...commonOverrides,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily,
          backgroundColor: '#181f2a',
          color: '#f1f5f9',
        },
        a: {
          color: '#60a5fa',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        },
        // Custom scrollbars for Webkit browsers
        '::-webkit-scrollbar': {
          width: '5px',
          background: '#232e3c',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#334155',
          borderRadius: '8px',
          border: '2px solid #232e3c',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#60a5fa',
        },
        // Fade-in animation for cards/lists
        '@global': {
          '@keyframes fadeInCard': {
            '0%': { opacity: 0, transform: 'translateY(2px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          ...commonOverrides.MuiInputBase.styleOverrides.root,
          background: '#232e3c',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 24px 0 rgba(30,41,59,0.12)',
          minWidth: 320,
          maxWidth: 420,
          fontWeight: 500,
          fontSize: '1rem',
          letterSpacing: 0.1,
          animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
          fontWeight: 600,
          fontSize: '1rem',
          alignItems: 'center',
          padding: '10px 18px',
          minWidth: 320,
          maxWidth: 420,
          animation: 'fadeInCard 0.2s cubic-bezier(0.4,0,0.2,1)',
        },
        standardSuccess: {
          backgroundColor: '#e8f7ee',
          color: '#22c55e',
          border: '1.5px solid #22c55e',
        },
        standardError: {
          backgroundColor: '#fbeaea',
          color: '#ef4444',
          border: '1.5px solid #ef4444',
        },
        standardInfo: {
          backgroundColor: '#eaf1fb',
          color: '#2563eb',
          border: '1.5px solid #2563eb',
        },
        standardWarning: {
          backgroundColor: '#fff7e6',
          color: '#f59e42',
          border: '1.5px solid #f59e42',
        },
        icon: {
          fontSize: 24,
          marginRight: 10,
        },
        message: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 8px 32px 0 rgba(30,41,59,0.18)',
          animation: 'fadeInCard 0.25s cubic-bezier(0.4,0,0.2,1)',
        },
      },
    },
  },
}); 