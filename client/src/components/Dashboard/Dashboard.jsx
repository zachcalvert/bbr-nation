import React from "react";
import { Grid, Paper, makeStyles } from '@material-ui/core';

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
    height: "100%",
    marginTop: theme.spacing(2)
  }
}));

export const Dashboard = ()  => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <BbrAppBar />
      <Grid className={classes.container} container spacing={3}>
        <Grid item xs={3}>
          <Paper className={classes.paper}>
            {/* <Menu /> */}
          </Paper>
        </Grid>
        <Grid item xs={9}>
          <Paper className={classes.paper}>
            <iframe src="https://giphy.com/embed/ud7WGyC5XOlZVOeV88" width="327" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/ud7WGyC5XOlZVOeV88">via GIPHY</a></p>
          </Paper>
        </Grid>
      </Grid>
    </div>
  )
};