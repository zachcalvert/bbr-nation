import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { Avatar, Divider, Link, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
    position: 'relative'
  },
  table: {
    minWidth: 450,
  },
  smallText: {
    fontSize: '14px',
  },
  large: {
    width: theme.spacing(20),
    height: theme.spacing(20),
  },
  teamHeader: {
    display: 'flex',
  },
  teamInfo: {
    margin: 'auto',
    textAlign: 'left'
  }
}));


export const Team = () => {
  const classes = useStyles();
  const { year, id } = useParams();
  const TEAM_URL = `${process.env.REACT_APP_DJANGO_URL}api/teams/${id}/`;
  const PLAYER_SEASONS_URL = `${process.env.REACT_APP_DJANGO_URL}api/playerseasons/?team=${id}`;
  const [team, setTeam] = useState({});
  const [players, setPlayers] = useState([]);
  
  useEffect(() => {
    async function fetchTeam() {
      const { data } = await axios.get(TEAM_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setTeam(data);
    }

    async function fetchPlayerSeasons() {
      const { data } = await axios.get(PLAYER_SEASONS_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setPlayers(data.results);
    }

    fetchPlayerSeasons();
    fetchTeam();
  }, [year, id]);
  
  return (
    <>
      <Paper className={classes.paper}>
        <div className={classes.teamHeader}>
        <Avatar className={classes.large} src={team.logoUrl} />
        <div className={classes.teamInfo}>
          <Typography variant='h4'>{team.name}</Typography>
          <Typography variant='h6'>Manager: <Link color='inherit' href={`/u/${team.manager}`}>{team.manager}</Link></Typography>
          <Typography variant='subtitle1'>Record: {team.wins}-{team.losses}</Typography>
          <Typography variant='subtitle1'>{team.points_for} points scored <span className={classes.smallText}>(#{team.all_time_rank} all time)</span></Typography>
          <Typography variant='subtitle1'>{team.points_against} points against <span className={classes.smallText}>(#{team.unlucky} all time)</span></Typography>
        </div>
        <Divider style={{ backgroundColor: 'transparent', clear: "both" }} />
        </div>
      </Paper>
      <Divider />
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="right">Position</TableCell>
            <TableCell align="right">Position Rank</TableCell>
            <TableCell align="right">Total Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.name}>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/player/${player.player_id}`}>{player.name}</Link>
              </TableCell>
              <TableCell align="right">{player.position}</TableCell>
              <TableCell align="right">{player.position_rank}</TableCell>
              <TableCell align="right">{player.total_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </>
  );
  }

