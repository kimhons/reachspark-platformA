import { createContext, useState, useContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

// Create context
const ThemeContext = createContext();

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Theme provider component
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };
  
  // Define the light theme
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#4F46E5', // Indigo-600
        light: '#6366F1', // Indigo-500
        dark: '#4338CA', // Indigo-700
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#059669', // Emerald-600
        light: '#10B981', // Emerald-500
        dark: '#047857', // Emerald-700
        contrastText: '#ffffff',
      },
      success: {
        main: '#10B981', // Emerald-500
        light: '#34D399', // Emerald-400
        dark: '#059669', // Emerald-600
      },
      warning: {
        main: '#F59E0B', // Amber-500
        light: '#FBBF24', // Amber-400
        dark: '#D97706', // Amber-600
      },
      error: {
        main: '#EF4444', // Red-500
        light: '#F87171', // Red-400
        dark: '#DC2626', // Red-600
      },
      info: {
        main: '#3B82F6', // Blue-500
        light: '#60A5FA', // Blue-400
        dark: '#2563EB', // Blue-600
      },
      background: {
        default: '#F9FAFB', // Gray-50
        paper: '#FFFFFF',
      },
      text: {
        primary: '#111827', // Gray-900
        secondary: '#4B5563', // Gray-600
        disabled: '#9CA3AF', // Gray-400
      },
      divider: 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
      },
      h2: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
      },
      h3: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h6: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.05),0px 1px 1px 0px rgba(0,0,0,0.03),0px 1px 3px 0px rgba(0,0,0,0.05)',
      '0px 3px 3px -2px rgba(0,0,0,0.05),0px 2px 6px 0px rgba(0,0,0,0.03),0px 1px 8px 0px rgba(0,0,0,0.05)',
      '0px 3px 4px -2px rgba(0,0,0,0.05),0px 3px 8px 0px rgba(0,0,0,0.03),0px 1px 12px 0px rgba(0,0,0,0.05)',
      '0px 2px 4px -1px rgba(0,0,0,0.05),0px 4px 5px 0px rgba(0,0,0,0.03),0px 1px 10px 0px rgba(0,0,0,0.05)',
      '0px 3px 5px -1px rgba(0,0,0,0.05),0px 5px 8px 0px rgba(0,0,0,0.03),0px 1px 14px 0px rgba(0,0,0,0.05)',
      '0px 3px 5px -1px rgba(0,0,0,0.05),0px 6px 10px 0px rgba(0,0,0,0.03),0px 1px 18px 0px rgba(0,0,0,0.05)',
      '0px 4px 5px -2px rgba(0,0,0,0.05),0px 7px 10px 1px rgba(0,0,0,0.03),0px 2px 16px 1px rgba(0,0,0,0.05)',
      '0px 5px 5px -3px rgba(0,0,0,0.05),0px 8px 10px 1px rgba(0,0,0,0.03),0px 3px 14px 2px rgba(0,0,0,0.05)',
      '0px 5px 6px -3px rgba(0,0,0,0.05),0px 9px 12px 1px rgba(0,0,0,0.03),0px 3px 16px 2px rgba(0,0,0,0.05)',
      '0px 6px 6px -3px rgba(0,0,0,0.05),0px 10px 14px 1px rgba(0,0,0,0.03),0px 4px 18px 3px rgba(0,0,0,0.05)',
      '0px 6px 7px -4px rgba(0,0,0,0.05),0px 11px 15px 1px rgba(0,0,0,0.03),0px 4px 20px 3px rgba(0,0,0,0.05)',
      '0px 7px 8px -4px rgba(0,0,0,0.05),0px 12px 17px 2px rgba(0,0,0,0.03),0px 5px 22px 4px rgba(0,0,0,0.05)',
      '0px 7px 8px -4px rgba(0,0,0,0.05),0px 13px 19px 2px rgba(0,0,0,0.03),0px 5px 24px 4px rgba(0,0,0,0.05)',
      '0px 7px 9px -4px rgba(0,0,0,0.05),0px 14px 21px 2px rgba(0,0,0,0.03),0px 5px 26px 4px rgba(0,0,0,0.05)',
      '0px 8px 9px -5px rgba(0,0,0,0.05),0px 15px 22px 2px rgba(0,0,0,0.03),0px 6px 28px 5px rgba(0,0,0,0.05)',
      '0px 8px 10px -5px rgba(0,0,0,0.05),0px 16px 24px 2px rgba(0,0,0,0.03),0px 6px 30px 5px rgba(0,0,0,0.05)',
      '0px 8px 11px -5px rgba(0,0,0,0.05),0px 17px 26px 2px rgba(0,0,0,0.03),0px 6px 32px 5px rgba(0,0,0,0.05)',
      '0px 9px 11px -5px rgba(0,0,0,0.05),0px 18px 28px 2px rgba(0,0,0,0.03),0px 7px 34px 6px rgba(0,0,0,0.05)',
      '0px 9px 12px -6px rgba(0,0,0,0.05),0px 19px 29px 2px rgba(0,0,0,0.03),0px 7px 36px 6px rgba(0,0,0,0.05)',
      '0px 10px 13px -6px rgba(0,0,0,0.05),0px 20px 31px 3px rgba(0,0,0,0.03),0px 8px 38px 7px rgba(0,0,0,0.05)',
      '0px 10px 13px -6px rgba(0,0,0,0.05),0px 21px 33px 3px rgba(0,0,0,0.03),0px 8px 40px 7px rgba(0,0,0,0.05)',
      '0px 10px 14px -6px rgba(0,0,0,0.05),0px 22px 35px 3px rgba(0,0,0,0.03),0px 8px 42px 7px rgba(0,0,0,0.05)',
      '0px 11px 14px -7px rgba(0,0,0,0.05),0px 23px 36px 3px rgba(0,0,0,0.03),0px 9px 44px 8px rgba(0,0,0,0.05)',
      '0px 11px 15px -7px rgba(0,0,0,0.05),0px 24px 38px 3px rgba(0,0,0,0.03),0px 9px 46px 8px rgba(0,0,0,0.05)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            },
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#4338CA', // Indigo-700
            },
          },
          containedSecondary: {
            '&:hover': {
              backgroundColor: '#047857', // Emerald-700
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 12,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
            boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          },
          head: {
            fontWeight: 600,
            backgroundColor: '#F9FAFB', // Gray-50
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
    },
  });
  
  // Define the dark theme
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#6366F1', // Indigo-500
        light: '#818CF8', // Indigo-400
        dark: '#4F46E5', // Indigo-600
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10B981', // Emerald-500
        light: '#34D399', // Emerald-400
        dark: '#059669', // Emerald-600
        contrastText: '#ffffff',
      },
      success: {
        main: '#10B981', // Emerald-500
        light: '#34D399', // Emerald-400
        dark: '#059669', // Emerald-600
      },
      warning: {
        main: '#F59E0B', // Amber-500
        light: '#FBBF24', // Amber-400
        dark: '#D97706', // Amber-600
      },
      error: {
        main: '#EF4444', // Red-500
        light: '#F87171', // Red-400
        dark: '#DC2626', // Red-600
      },
      info: {
        main: '#3B82F6', // Blue-500
        light: '#60A5FA', // Blue-400
        dark: '#2563EB', // Blue-600
      },
      background: {
        default: '#111827', // Gray-900
        paper: '#1F2937', // Gray-800
      },
      text: {
        primary: '#F9FAFB', // Gray-50
        secondary: '#D1D5DB', // Gray-300
        disabled: '#6B7280', // Gray-500
      },
      divider: 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
      },
      h2: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
      },
      h3: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h6: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
            },
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#4F46E5', // Indigo-600
            },
          },
          containedSecondary: {
            '&:hover': {
              backgroundColor: '#059669', // Emerald-600
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
            backgroundColor: '#1F2937', // Gray-800
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 12,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: '#111827', // Gray-900
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
            boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: '#111827', // Gray-900
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          },
          head: {
            fontWeight: 600,
            backgroundColor: '#1F2937', // Gray-800
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
    },
  });
  
  // Select the current theme based on mode
  const theme = mode === 'light' ? lightTheme : darkTheme;
  
  // Context value
  const value = {
    mode,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
