import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import { Divider, Link, Table, Typography } from '@material-ui/core';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 300,
  },
  card: {
    padding: '0',
    marginBottom: theme.spacing(2)
  },
  title: {
    fontSize: 14,
  },
  actions: {
    paddingLeft: '20px'
  },
  cardContent: {
    display: 'flex',
    margin: 'auto'
  },
  seasonBio: {
    margin: 'auto auto auto 20px',
    display: 'block',
  },
  pos: {
    padding: '5px',
    fontSize: 16
  }
}));

export const Season = () => {
  const classes = useStyles();
  const { year } = useParams();
  const DETAIL_URL = `${process.env.REACT_APP_DJANGO_URL}api/seasons/${year}/`
  const [teams, setTeams] = useState([]);
  const [winner, setWinner] = useState('');
  const [pierced, setPierced] = useState('');

  useEffect(() => {
    async function fetchSeason() {
      const { data } = await axios.get(DETAIL_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      console.log(data);
      setTeams(data.teams);
      setWinner(data.winner);
      setPierced(data.piercee);
    }
    fetchSeason();
  }, [DETAIL_URL, year]);
  
  return (
    <>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <div className={classes.seasonBio}>
            <Typography variant="h5" component="h2">
              The {year} BBR Season
            </Typography>
            <Divider />
            <Typography color="textSecondary" className={classes.pos} >🏆 &nbsp;&nbsp;<Link color='inherit' href={`/u/${winner}`}>{winner}</Link></Typography>
            <Typography color="textSecondary" className={classes.pos} >💍 &nbsp;&nbsp;<Link color='inherit' href={`/u/${pierced}`}>{pierced}</Link></Typography>
          </div>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
            <TableHead>
            <TableRow>
                <TableCell>Team</TableCell>
                <TableCell align="right">Manager</TableCell>
                <TableCell align="right">W</TableCell>
                <TableCell align="right">L</TableCell>
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

