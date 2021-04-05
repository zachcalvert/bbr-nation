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
}));

export const MemberCareer = (props) => {
  const classes = useStyles();
  const { teams } = props;
  
  return (
    <>
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
          <TableHead>
          <TableRow>
              <TableCell>Year</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Final Standing</TableCell>
              <TableCell align="right">Record</TableCell>
              <TableCell align="right">Points Scored</TableCell>
              <TableCell align="right">Points Against</TableCell>
          </TableRow>
          </TableHead>
          <TableBody>
          {teams.map((team) => (
            <TableRow key={team.name}>
              <TableCell>
                {team.year}
              </TableCell>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/team/${team.id}`}>{team.name}</Link>
              </TableCell>
              <TableCell align="right">
                {team.final_standing}
              </TableCell>
              <TableCell align="right">{team.wins}-{team.losses}</TableCell>
              <TableCell align="right">{team.points_for}</TableCell>
              <TableCell align="right">{team.points_against}</TableCell>
            </TableRow>
          ))}
          </TableBody>
      </Table>
    </TableContainer>
    </>
  );
  }
