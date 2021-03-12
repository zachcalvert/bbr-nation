import React  from 'react';
import { SocketIOProvider } from "use-socketio";

import { Dashboard } from "./components/Dashboard/Dashboard";
import { createMuiTheme, CssBaseline, ThemeProvider, useMediaQuery } from '@material-ui/core';

const getCookie = (name) => {
  var cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].toString().replace(/^([\s]*)|([\s]*)$/g, "");
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

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

  const csrfToken = getCookie('csrftoken');
  sessionStorage.setItem('bbr-token', csrfToken);

  return (
    <SocketIOProvider url={process.env.REACT_APP_SOCKET_HOST}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Dashboard />
      </ThemeProvider>
    </SocketIOProvider>
  )
};