import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import { Link, Table, Typography } from '@material-ui/core';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';


const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: theme.spacing(4),
    position: 'relative'
  },
  table: {
    minWidth: 450,
  },
}));

export const Season = () => {
  const classes = useStyles();
  const { year } = useParams();
  const DETAIL_URL = `${process.env.REACT_APP_API_URL}/seasons/${year}/`
  const [teams, setTeams] = useState([]);
  const [winner, setWinner] = useState('');
  const [pierced, setPierced] = useState('');

  useEffect(() => {
    async function fetchSeason() {
      const { data } = await axios.get(DETAIL_URL);
      console.log(data);
      setTeams(data.teams);
      setWinner(data.winner);
      setPierced(data.piercee);
    }
    fetchSeason();
  }, [DETAIL_URL, year]);
  
  return (
    <>
    <Paper className={classes.paper}>
      <Typography variant='h4'>The {year} BBR Season</Typography>
      <Typography variant='h6'>Champ: <Link color='inherit' href={`/u/${winner}`}>{winner}</Link></Typography>
      <Typography variant='h6'>Pierced: <Link color='inherit' href={`/u/${pierced}`}>{pierced}</Link></Typography>
    </Paper>
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
          <TableHead>
          <TableRow>
              <TableCell>Team</TableCell>
              <TableCell align="right">Manager</TableCell>
              <TableCell align="right">Wins</TableCell>
              <TableCell align="right">Losses</TableCell>
          </TableRow>
          </TableHead>
          <TableBody>
          {teams.map((team) => (
            <TableRow key={team.name}>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/season/${year}/team/${team.id}`}>{team.name}</Link>
              </TableCell>
              <TableCell align="right">
                <Link color='inherit' href={`/u/${team.manager}/`}>{team.manager}</Link>
              </TableCell>
              <TableCell align="right">{team.wins}</TableCell>
              <TableCell align="right">{team.losses}</TableCell>
            </TableRow>
          ))}
          </TableBody>
      </Table>
    </TableContainer>
    </>
  );
  }

