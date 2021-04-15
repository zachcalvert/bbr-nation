import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Avatar, Divider, Link, makeStyles, Paper, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 10px'
  },
  large: {
    width: theme.spacing(14),
    height: theme.spacing(14),
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
    position: 'relative'
  },
  card: {
    padding: '0',
    marginBottom: '10px'
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
  playerBio: {
    margin: 'auto auto auto 20px',
    display: 'block',
  }
}));

export const Player = () => {
  const classes = useStyles();
  const { id } = useParams();
  const DETAIL_URL = `${process.env.REACT_APP_DJANGO_URL}api/players/${id}/`;
  const [player, setPlayer] = useState({})

  useEffect(() => {
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    async function fetchPlayerDetails() {
      const { data } = await axios.get(DETAIL_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setPlayer(data);
    }
    fetchPlayerDetails();
  }, [DETAIL_URL, id]);

  return (
    <>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Avatar className={classes.large} src={player.image_url} />

          <div className={classes.playerBio}>
            <Typography variant="h5" component="h2">
              {player.name}
            </Typography>
            <Divider />
            <Typography variant="p" color="textSecondary">{player.position}</Typography>
          </div>
        </CardContent>

        <CardActions className={classes.actions}>
          {player.champ_years && player.champ_years.map((year) => (
            <>
              <Typography style={{ padding: '0 10px' }} variant='h6'><span role='img'>🏆</span> {year}</Typography>
            </>
          ))}
          {player.pierced_years && player.pierced_years.map((year) => (
            <>
              <Typography style={{ padding: '0 10px' }} variant='h6'><span role='img'>💍</span> {year}</Typography>
            </>
          ))}
        </CardActions>
  
      </Card>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
            <TableCell>Season</TableCell>
            <TableCell align="right">PRK</TableCell>
            <TableCell align="right">Total Points</TableCell>
            <TableCell align="right">Team</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {player.seasons?.map((season) => (
            <TableRow key={season.year}>
              <TableCell component="th" scope="row">
                <Link color='inherit' href={`/season/${season.year}`}>{season.year}</Link>
              </TableCell>
              <TableCell align="right">{season.position_rank}</TableCell>
              <TableCell align="right">{season.points_scored}</TableCell>
              <TableCell align="right">
                <Link color='inherit' href={`/season/${season.year}/team/${season.team_id}`}>{season.team_name}</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </>
  )
}