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

export default function ToggleButtons() {
  const [filter, setFilter] = React.useState('ALL');

  const handleFilter = (event, newFilter) => {
    setFilter(newFilter);
  };

  return (
    <ToggleButtonGroup
      value={filter}
      exclusive
      onChange={handleFilter}
      aria-label="position-filter"
    >
      <ToggleButton value="ALL" aria-label="left aligned">
        <Typography variant='h6'>All</Typography>
      </ToggleButton>
      <ToggleButton value="QB" aria-label="centered">
      <Typography variant='h6'>QB</Typography>
      </ToggleButton>
      <ToggleButton value="RB" aria-label="right aligned">
      <Typography variant='h6'>RB</Typography>
      </ToggleButton>
      <ToggleButton value="WR" aria-label="justified" disabled>
        <Typography variant='h6'>WR</Typography>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export const AllPlayers = () => {
  const classes = useStyles();
  const PLAYERS_URL = `${process.env.REACT_APP_API_URL}/playerseasons/`
  const [playerSeasons, setPlayerSeasons] = React.useState([]);
  const [filter, setFilter] = React.useState('ALL');

  const handleFilter = (event, newFilter) => {
    setFilter(newFilter);
  };


  React.useEffect(() => {
    async function fetchPlayerSeasons() {
      const { data } = await axios.get(PLAYERS_URL);
      console.log(data.results);
      setPlayerSeasons(data.results);
    }
    fetchPlayerSeasons();
  }, []);
  
  return (
    <>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilter}
        aria-label="position-filter"
      >
        <ToggleButton value="ALL" aria-label="left aligned">
          <Typography variant='h6'>All</Typography>
        </ToggleButton>
        <ToggleButton value="QB" aria-label="centered">
        <Typography variant='h6'>QB</Typography>
        </ToggleButton>
        <ToggleButton value="RB" aria-label="right aligned">
        <Typography variant='h6'>RB</Typography>
        </ToggleButton>
        <ToggleButton value="WR" aria-label="justified" disabled>
          <Typography variant='h6'>WR</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      <Divider />
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="right">Year</TableCell>
            <TableCell align="right">Team</TableCell>
            <TableCell align="right">Position</TableCell>
            <TableCell align="right">Position Rank</TableCell>
            <TableCell align="right">Total Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {playerSeasons.map((playerSeason) => (
            <TableRow key={playerSeason.name}>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/player/${playerSeason.player_id}`}>{playerSeason.name}</Link>
              </TableCell>
              <TableCell align="right">{playerSeason.season}</TableCell>
              <TableCell align="right" component="th" scope="row">
                <Link color='inherit' href={`/season/${playerSeason.season}/team/${playerSeason.team_id}`}>{playerSeason.team_name}</Link>
              </TableCell>
              <TableCell align="right">{playerSeason.position}</TableCell>
              <TableCell align="right">{playerSeason.position_rank}</TableCell>
              <TableCell align="right">{playerSeason.total_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </>
  );
  }

