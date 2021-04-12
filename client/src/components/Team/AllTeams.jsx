import React, { useEffect, useState } from 'react';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import { Hidden, Link, Table } from '@material-ui/core';
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
    marginTop: 0,
    position: 'relative'
  },
  table: {
    minWidth: 350,
  },
}));

export const AllTeams = () => {
  const classes = useStyles();
  const DETAIL_URL = `${process.env.REACT_APP_DJANGO_URL}api/teams/all/`
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await axios.get(DETAIL_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setTeams(data.results);
    }
    fetchTeams();
  }, [DETAIL_URL]);
  
  return (
    <>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
          <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">Year</TableCell>
              <TableCell align="right">Points Scored</TableCell>
              <Hidden smDown>
              <TableCell align="right">Manager</TableCell>
              </Hidden>
              <Hidden mdDown>
                <TableCell align="right">Wins</TableCell>
              </Hidden>
              <Hidden mdDown>
              <TableCell align="right">Losses</TableCell>
              </Hidden>
          </TableRow>
          </TableHead>
          <TableBody>
          {teams.map((team, index) => (
            <TableRow key={team.name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/season/${team.year}/team/${team.id}`}>{team.name}</Link>
              </TableCell>
              <TableCell align="right">{team.year}</TableCell>
              <TableCell align="right">{team.points_for}</TableCell>
              <Hidden smDown>
              <TableCell align="right">
                <Link color='inherit' href={`/u/${team.manager}/`}>{team.manager}</Link>
              </TableCell>
              </Hidden>
              <Hidden mdDown>
              <TableCell align="right">{team.wins}</TableCell>
              </Hidden>
              <Hidden mdDown>
              <TableCell align="right">{team.losses}</TableCell>
              </Hidden>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

