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
import { Divider, Hidden, Link, Typography } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const MEMBERS_URL = `${process.env.REACT_APP_DJANGO_URL}api/members/all`;

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

export const AllMembers = () => {
  const classes = useStyles();
  const [memberCareers, setMemberCareers] = React.useState([]);
  const [filter, setFilter] = React.useState('total');
  
  async function fetchMemberCareers(filter) {
    let url = MEMBERS_URL;
    setMemberCareers([])
    if (filter) {
      url = `${MEMBERS_URL}?ordering=${filter}`
    }
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setMemberCareers(data);
  }

  const handleFilter = (event, newFilter) => {
    setFilter(newFilter)
  };

  React.useEffect(() => {
    fetchMemberCareers(filter);
  }, [filter]);
  
  return (
    <>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilter}
        aria-label="position-filter">
            <ToggleButton value="total" aria-label="right aligned">
            <Typography variant='h6'>Total</Typography>
            </ToggleButton>
            <ToggleButton value="average" aria-label="centered">
            <Typography variant='h6'>Average</Typography>
            </ToggleButton>
      </ToggleButtonGroup>
      <Divider />
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Member</TableCell>
            <Hidden smDown>
            <TableCell align="right">Seasons</TableCell>
            </Hidden>
            <TableCell align="right">Total Points</TableCell>
            <TableCell align="right">Weekly Average</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {memberCareers?.map((member, index) => (
            <TableRow key={member.name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/u/${member.name}`}>{member.name}</Link>
              </TableCell>
              
              <Hidden smDown>
                <TableCell align="right">{member.seasons}</TableCell>
              </Hidden>
              <TableCell align="right">{member.total_points}</TableCell>
              <TableCell align="right">{member.average_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </>
  );
}

