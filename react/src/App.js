import React  from 'react';
import { SocketIOProvider } from "use-socketio";

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
    <SocketIOProvider url={process.env.REACT_APP_SOCKET_HOST}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Dashboard />
      </ThemeProvider>
    </SocketIOProvider>
  )
};