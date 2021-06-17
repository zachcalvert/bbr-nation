import React from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Avatar, Button, Card, CardActions, Dialog, Slide, Toolbar, Typography } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: '100%',
    width: '100%',
  },
  content: {
    width: '100%',
    height: '100%',
    padding: 30,
    display: 'flex',
    marginTop: 60
  },
  table: {
    minWidth: 350,
  },
  medium: {
    height: 50,
    width: 50
  },
  nameCell: {
    display: 'flex'
  },
  name: {
    margin: 'auto',
    marginLeft: 10
  }
});

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const DraftResults = ()  => {
  const classes = useStyles();
  const [draftOpen, setDraftOpen] = React.useState(true);
  const [picks, setPicks] = React.useState([]);

  async function fetchDraft() {
    const { data } = await axios.get(`${process.env.REACT_APP_DJANGO_URL}api/drafts/3/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setPicks(data.picks);
  }

  React.useEffect(() => {
    fetchDraft();
  }, []);

  return (
    <Grid container className={classes.root} spacing={2}>
      <Dialog className={classes.game} fullScreen open={draftOpen} TransitionComponent={Transition}>
        <AppBar position='fixed' className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" className={classes.title}>Bachelorette Draft Results</Typography>
          </Toolbar>
        </AppBar>
        <main className={classes.content}>
          <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Pick</TableCell>
                  <TableCell>Contestant</TableCell>
                  <TableCell>Team</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {picks.map((pick) => (
                  <TableRow key={pick.pick}>
                    <TableCell component="th" scope="row">
                      {pick.pick}
                    </TableCell>
                    <TableCell>
                        <div className={classes.nameCell}>
                          <Avatar src={pick.draftee_image} />
                          <span className={classes.name}>{pick.draftee}</span>
                        </div>
                    </TableCell>
                    <TableCell>{pick.player}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </main>
      </Dialog>
    </Grid>
  )
}