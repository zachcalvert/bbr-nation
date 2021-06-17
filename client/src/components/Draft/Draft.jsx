import React from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles } from '@material-ui/core/styles';
import { Avatar, Button, Card, CardActions, Dialog, Divider, List, ListItem, ListItemText, Slide, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const MEMBERS = [
  'Jordan',
  'Kate',
  'Michelle',
  'Riach',
  'Soule',
  'Zach'
]

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
    display: 'flex'
  },
  list: {
    height: '100%',
    background: '#F5F5F5',
    width: 300,
    padding: 16
  },
  board: {
    padding: 16
  },
  card: {
    padding: '16px'
  },
  large: {
    height: 150,
    width: 150
  },
  medium: {
    height: 50,
    width: 50
  },
  toggle: {
    margin: 'auto',
    padding: 20
  }
});

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const Draft = ()  => {
  const classes = useStyles();
  const { id } = useParams();
  const [draftOpen, setDraftOpen] = React.useState(true);
  const [contestants, setContestants] = React.useState([]);
  const [selectedContestantId, setSelectedContestantId] = React.useState(null);
  const [player, setPlayer] = React.useState(null);
  const [picks, setPicks] = React.useState([]);

  const IMAGE_URL = process.env.REACT_APP_DJANGO_URL.slice(0, -1)

  async function fetchDraft() {
    const { data } = await axios.get(`${process.env.REACT_APP_DJANGO_URL}api/drafts/${id}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setContestants(data.contestants);
    setPicks(data.picks);
  }

  React.useEffect(() => {
    fetchDraft();
  }, []);

  const handlePlayer = (event, newPlayer) => {
    setPlayer(newPlayer)
  };

  async function handleDraftPick() {
    let postData = {
        draftee_id: selectedContestantId,
        drafter_id: 15,
        draft_id: id,
        player: player
    }
    await axios.post(`${process.env.REACT_APP_DJANGO_URL}api/draftpicks/`, postData, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    fetchDraft();
  }

  return (
    <Grid container className={classes.root} spacing={2}>
      <Dialog className={classes.game} fullScreen open={draftOpen} TransitionComponent={Transition}>
        <ToggleButtonGroup
          className={classes.toggle}
          value={player}
          exclusive
          onChange={handlePlayer}
          aria-label="position-filter">
          <ToggleButton value="kate">
            <Typography variant='h6'>Kate</Typography>
          </ToggleButton>
          <ToggleButton value="jordan" aria-label="right aligned">
            <Typography variant='h6'>Jordan</Typography>
          </ToggleButton>
          <ToggleButton value="michelle" aria-label="justified">
            <Typography variant='h6'>Michelle</Typography>
          </ToggleButton>
          <ToggleButton value="riach" aria-label="justified">
            <Typography variant='h6'>Riach</Typography>
          </ToggleButton>
          <ToggleButton value="soule" aria-label="justified">
            <Typography variant='h6'>Soule</Typography>
          </ToggleButton>
          <ToggleButton value="zach" aria-label="justified">
            <Typography variant='h6'>Zach</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
        <Divider />
        <main className={classes.content}>
        <List className={classes.list}>
          <Typography variant='h6'>Picks</Typography>
          {picks.map((pick, index) => (
            <ListItem key={index}>
              <ListItemText>{index+1}. <Avatar className={classes.medium} src={`${IMAGE_URL}${pick.draftee_image}`} /> {pick.draftee} ({pick.player})</ListItemText>
            </ListItem>
          ))}
        </List>

        <Grid className={classes.board} container spacing={3}>
          {contestants.map((c, index) => (
            <Grid item>
              <Card className={classes.card} onClick={() => setSelectedContestantId(c.id)}>
                <Avatar className={classes.large} src={`${IMAGE_URL}${c.image}`} />
                <Typography variant='h6'>{c.name}</Typography>
                <Typography variant='subtitle1'>{c.profession}, {c.age}</Typography>
                <CardActions>
                  <Button disabled={selectedContestantId !== c.id && player} onClick={handleDraftPick} color='primary' variant='contained'>Draft {c.name}</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        </main>
      </Dialog>
  </Grid>
  )
}