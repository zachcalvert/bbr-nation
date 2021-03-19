import React from "react";
import { Grid, Paper, makeStyles, Hidden } from '@material-ui/core';

import { BbrAppBar } from "../AppBar/AppBar";
import { Feed } from "../Feed/Feed";

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

export const Dashboard = ()  => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <BbrAppBar />
      <Grid className={classes.container} container spacing={3}>
        <Hidden smDown>
          <Grid item md={1}></Grid>
        </Hidden>
        <Grid item md={10} xs={12}>
          <Feed />
        </Grid>
      </Grid>
    </div>
  )
};