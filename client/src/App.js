import React  from 'react';

import { Dashboard } from "./components/Dashboard/Dashboard";
import { createMuiTheme, CssBaseline, ThemeProvider, useMediaQuery } from '@material-ui/core';


export const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: 'dark',
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  )
};