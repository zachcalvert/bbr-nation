import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
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
  const TEAM_URL = `${process.env.REACT_APP_API_URL}/teams/${id}/`
  const PLAYER_SEASONS_URL = `${process.env.REACT_APP_API_URL}/playerseasons/?team=${id}`
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [players, setPlayers] = useState([]);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [finalStanding, setFinalStanding] = useState(1);
  const [standing, setStanding] = useState(1);
  const [allTimeRank, setAllTimeRank] = useState(null);
  const [unlucky, setUnlucky] = useState(null);
  const [pointsFor, setPointsFor] = useState(null);
  const [pointsAgainst, setPointsAgainst] = useState(null);

  
  useEffect(() => {
    async function fetchTeam() {
      const { data } = await axios.get(TEAM_URL);
      console.log(data)
      setName(data.name);
      setManager(data.manager);
      setLogoUrl(data.logo_url);
      setWins(data.wins);
      setLosses(data.losses);
      setStanding(data.standing);
      setFinalStanding(data.standing);
      setAllTimeRank(data.all_time_rank);
      setUnlucky(data.unlucky);
      setPointsFor(data.points_for);
      setPointsAgainst(data.points_against);
    }

    async function fetchPlayerSeasons() {
      const { data } = await axios.get(PLAYER_SEASONS_URL);
      setPlayers(data.results);
      console.log(data)
    }

    fetchPlayerSeasons();
    fetchTeam();
  }, [year, id]);
  
  return (
    <>
      <Paper className={classes.paper}>
        <div className={classes.teamHeader}>
        <Avatar className={classes.large} src={logoUrl} />
        <div className={classes.teamInfo}>
          <Typography variant='h4'>{name}</Typography>
          <Typography variant='h6'>Manager: <Link color='inherit' href={`/u/${manager}`}>{manager}</Link></Typography>
          <Typography variant='subtitle1'>Record: {wins}-{losses}</Typography>
          <Typography variant='subtitle1'>All Time Rank: {allTimeRank} <span className={classes.smallText}>({pointsFor} points scored)</span></Typography>
          <Typography variant='subtitle1'>Unlucky Rank: {unlucky} <span className={classes.smallText}>({pointsAgainst} points against)</span></Typography>
        </div>
        <Divider style={{ backgroundColor: 'transparent', clear: "both" }} />
        </div>
      </Paper>
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

