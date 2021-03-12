import React, { useState } from "react";
import { Grid, Paper, makeStyles } from '@material-ui/core';

import { BbrAppBar } from "../AppBar/AppBar";
import { Chat } from "../Chat/Chat";
import { Login } from "../Login/Login";

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
    height: "100%",
    marginTop: theme.spacing(2)
  }
}));

export const Dashboard = ()  => {
  const classes = useStyles();
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div className={classes.root}>
      <BbrAppBar />
      <Grid className={classes.container} container spacing={3}>
        <Grid item xs={3}>
          <Paper className={classes.paper}>
            {loggedIn ? <Chat /> : <Login />}
          </Paper>
        </Grid>
        <Grid item xs={9}>
          <Paper className={classes.paper}></Paper>
        </Grid>
      </Grid>
    </div>
  )
};