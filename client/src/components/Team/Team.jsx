import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { Avatar, Link, Typography } from '@material-ui/core';

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 350,
  },
  large: {
    width: theme.spacing(16),
    height: theme.spacing(16),
    margin: '10px 0',
  },
  card: {
    padding: '0 15px 10px',
    marginBottom: theme.spacing(2) 
  },
  title: {
    fontSize: 14,
  },
  actions: {
    paddingLeft: '20px'
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
      <Card className={classes.card} variant="outlined">

        <CardContent>
          <Typography className={classes.title} color="textSecondary" gutterBottom>
            {team.year}
          </Typography>
          <Typography variant="h5" component="h2">
            {team.name}
          </Typography>
          {team.logo_url && <Avatar className={classes.large} src={team.logo_url} />}
          
          <Typography className={classes.pos} >
            <Typography variant='subtitle1'>Manager: <Link color='inherit' href={`/u/${team.manager}`}>{team.manager}</Link></Typography>
          </Typography>
          
          <Typography variant="body2" component="p" color="textSecondary">
            Record: {team.wins}-{team.losses}<br />
            {team.points_for} points scored <span className={classes.smallText}>(#{team.all_time_rank} all time)</span><br />
            {team.points_against} points against <span className={classes.smallText}>(#{team.unlucky} all time)</span>
          </Typography>

        </CardContent>

        {(team.champ || team.pierced) &&
          <CardActions className={classes.actions}>
            {team.champ && <Typography><span role="img">🏆 &nbsp;League Champ</span></Typography>}
            {team.pierced && <Typography><span role="img">💍 &nbsp;Pierced</span></Typography>}
          </CardActions>
        }
    </Card>

      <TableContainer component={Paper} variant='outlined'>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Player</TableCell>
            <TableCell align="right">Position</TableCell>
            <TableCell align="right">PRK</TableCell>
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

