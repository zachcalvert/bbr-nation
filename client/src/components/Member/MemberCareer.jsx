import React from 'react';
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
  }
}));

export const MemberCareer = (props) => {
  const classes = useStyles();
  const { teams } = props;
  
  return (
    <>
    <TableContainer component={Paper} variant="outlined">
      <Table className={classes.table} aria-label="simple table">
          <TableHead>
          <TableRow>
              <TableCell>Year</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">Record</TableCell>
              <TableCell align="right">Final Standing</TableCell>
              <Hidden smDown>
              <TableCell align="right">Points Scored</TableCell>
              </Hidden>
              <Hidden smDown>
              <TableCell align="right">Points Against</TableCell>
              </Hidden>
          </TableRow>
          </TableHead>
          <TableBody>
          {teams.map((team) => (
            <TableRow key={team.name}>
              <TableCell>
                {team.year}
              </TableCell>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/season/${team.year}/team/${team.id}`}>{team.name}</Link>
              </TableCell>
              <TableCell align="right">{team.wins}-{team.losses}</TableCell>
              <TableCell align="right">
                {team.final_standing}
              </TableCell>
              <Hidden smDown>
                <TableCell align="right">{team.points_for}</TableCell>
              </Hidden>
              <Hidden smDown>
                <TableCell align="right">{team.points_against}</TableCell>
              </Hidden>
            </TableRow>
          ))}
          </TableBody>
      </Table>
    </TableContainer>
    </>
  );
  }

