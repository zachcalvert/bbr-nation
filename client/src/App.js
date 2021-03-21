import React  from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { createMuiTheme, CssBaseline, Grid, Hidden, ThemeProvider, makeStyles } from '@material-ui/core';

import { BbAppBar } from "./components/AppBar/AppBar";
import { Page } from "./components/Page/Page";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: "100%"
  },
  container: {
    height: "90%"
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: theme.spacing(2)
  }
}));

export const App = () => {
  const classes = useStyles();
  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: 'dark',
        },
      }),
    [],
  );

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={classes.root}>
          <BbAppBar />
          <Grid className={classes.container} container spacing={3}>
            <Hidden smDown>
              <Grid item md={1}></Grid>
            </Hidden>
            <Grid item md={10} sm={12} xs={12}>
              <Route path="/:slug?" component={Page} />
            </Grid>
          </Grid>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
};