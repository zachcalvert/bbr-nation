import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Avatar, Divider, Grid, makeStyles, Paper, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 10px'
  },
  large: {
    width: theme.spacing(20),
    height: theme.spacing(20),
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
    position: 'relative'
  },
}));

export const Player = () => {
  const classes = useStyles();

  const { id } = useParams();
  const DETAIL_URL = `${process.env.REACT_APP_API_URL}/players/${id}/`
  const [player, setPlayer] = useState({})

  useEffect(() => {
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    async function fetchPlayerDetails() {
      const { data } = await axios.get(DETAIL_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setPlayer(data);
    }
    fetchPlayerDetails();
  }, [DETAIL_URL, id]);

  return (
    <>
      <Paper className={classes.paper}>
      <Grid container spacing={1}>
        <Grid item>
          <Avatar className={classes.large} alt={player.name} src={player.image_url} />
        </Grid>
        <Grid className={classes.leftAlign} item>
          <Typography variant='h3'>{player.name}</Typography>
        </Grid>
      </Grid>
      </Paper>
      <Divider color='transparent' />
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Season</TableCell>
            <TableCell align="right">Position Rank</TableCell>
            <TableCell align="right">Total Points</TableCell>
            <TableCell align="right">Team</TableCell>
            <TableCell align="right">Owner</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {player.seasons?.map((season) => (
            <TableRow key={season.year}>
              <TableCell component="th" scope="row">{season.year}</TableCell>
              <TableCell align="right">{season.position_rank}</TableCell>
              <TableCell align="right">{season.points_scored}</TableCell>
              <TableCell align="right">{season.team_name}</TableCell>
              <TableCell align="right">{season.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </>
  )
}