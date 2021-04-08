import React from 'react';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Divider, Link, Typography } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const PLAYERS_URL = `/api/playerseasons/`

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
    minWidth: 350,
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

export const AllPlayers = () => {
  const classes = useStyles();
  const [playerSeasons, setPlayerSeasons] = React.useState([]);
  const [filter, setFilter] = React.useState('all');

  const handleFilter = (event, newFilter) => {
    setFilter(newFilter)
  };
  
  async function fetchPlayerSeasons(filter) {
    let url = PLAYERS_URL;
    setPlayerSeasons([])
    if (filter) {
      url = `${PLAYERS_URL}?position=${filter}`
    }
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setPlayerSeasons(data.results);
  }

  React.useEffect(() => {
    fetchPlayerSeasons(filter);
  }, [filter]);
  
  return (
    <>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilter}
        aria-label="position-filter">
        <ToggleButton value="all" aria-label="left aligned">
          <Typography variant='h6'>All</Typography>
        </ToggleButton>
        <ToggleButton value="qb" aria-label="centered">
        <Typography variant='h6'>QB</Typography>
        </ToggleButton>
        <ToggleButton value="rb" aria-label="right aligned">
        <Typography variant='h6'>RB</Typography>
        </ToggleButton>
        <ToggleButton value="wr" aria-label="justified">
          <Typography variant='h6'>WR</Typography>
        </ToggleButton>
        <ToggleButton value="te" aria-label="justified">
          <Typography variant='h6'>TE</Typography>
        </ToggleButton>
        <ToggleButton value="dst" aria-label="justified">
          <Typography variant='h6'>D/ST</Typography>
        </ToggleButton>
        <ToggleButton value="k" aria-label="justified">
          <Typography variant='h6'>K</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      <Divider />
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Year</TableCell>
            <TableCell align="right">Team</TableCell>
            <TableCell align="right">Total Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {playerSeasons.map((playerSeason, index) => (
            <TableRow key={playerSeason.name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/player/${playerSeason.player_id}`}>{playerSeason.name}</Link>
              </TableCell>
              <TableCell align="right">{playerSeason.season}</TableCell>
              <TableCell align="right" component="th" scope="row">
                <Link color='inherit' href={`/season/${playerSeason.season}/team/${playerSeason.team_id}`}>{playerSeason.team_name}</Link>
              </TableCell>
              <TableCell align="right">{playerSeason.total_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </>
  );
}

