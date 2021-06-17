import React from "react";
import axios from "axios";
import { Button, Divider, FormControlLabel, FormGroup, makeStyles, Paper, Slide, Snackbar, Switch, TextField, Typography } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const useStyles = makeStyles((theme) => ({
    paper: {
      padding: theme.spacing(2),
      height: "auto",
      position: 'relative'
    },
    formGroup: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
    switch: {
      marginLeft: theme.spacing(2)
    }
  })
);

export const Thought = () => {
  const classes = useStyles();
  const THOUGHT_URL = `${process.env.REACT_APP_DJANGO_URL}api/thoughts/`;
  const [id, setId] = React.useState(null);
  const [text, setText] = React.useState(null);
  const [player, setPlayer] = React.useState(null);
  const [sentiment, setSentiment] = React.useState('NEUTRAL');
  const [isUpdate, setIsUpdate] = React.useState(false);
  const [snackBarOpen, setSnackBarOpen] = React.useState(false);
  const [action, setAction] = React.useState('saved');

  async function fetchRandomThought() {
    const { data } = await axios.get(THOUGHT_URL + 'random/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setId(data.results[0].id);
    setText(data.results[0].text);
    setPlayer(data.results[0].player);
  }

  React.useEffect(() => {
    fetchRandomThought();
  }, [])

  async function handleDelete() {
    setAction('deleted');
    const { status } = await axios.delete(THOUGHT_URL + `${id}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    if (status === 204) {
      setSnackBarOpen(true);
      setTimeout(function (){
        setSnackBarOpen(false)
      }, 2000);
    }
    fetchRandomThought();
  }

  async function handleSave() {
    setAction('saved');
    let postData = {
        text: text,
        player: player,
        sentiment: sentiment,
        is_update: isUpdate
    }
    const { status } = await axios.put(THOUGHT_URL + `${id}/`, postData, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (status === 200) {
      setSnackBarOpen(true);
      setTimeout(function (){
        setSnackBarOpen(false)
      }, 2000);
    }
    fetchRandomThought();
  }

  function TransitionDown(props) {
    return <Slide {...props} direction="down" />;
  }

  const handleSentiment = (event, newSentiment) => {
    console.log(newSentiment);
    setSentiment(newSentiment);
  };

  const handleIsUpdate = (event, newValue) => {
    setIsUpdate(!isUpdate);
  };


  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackBarOpen}
        TransitionComponent={TransitionDown}
        message={`Thought ${action}!`}
        key='link-copied-snackbar' />

      <Paper className={classes.paper} variant='outlined'>
        {id && <form className={classes.root} noValidate autoComplete="off">
          <TextField
            id="standard-basic" 
            defaultValue={text}
            value={text}
            multiline={true}
            autoFocus={true}
            fullWidth={true}
            onChange={e => setText(e.target.value)}
          />

          <FormGroup row className={classes.formGroup}>
            <ToggleButtonGroup
              value={sentiment}
              exclusive
              onChange={handleSentiment}
              aria-label="sentiment">
              <ToggleButton value="NEUTRAL" aria-label="neutral">😐</ToggleButton>
              <ToggleButton value="LAUGHING" aria-label="centered">😂</ToggleButton>
              <ToggleButton value="NEGATIVE" aria-label="right aligned">😤</ToggleButton>
              <ToggleButton value="POSITIVE" aria-label="positive">🤗</ToggleButton>
            </ToggleButtonGroup>

            <FormControlLabel 
              className={classes.switch}
              control={<Switch checked={isUpdate}
              onChange={handleIsUpdate}
              name="isUpdate" />}
              label="Is Update"
            />
          </FormGroup>

          <Divider />

          <Button id="delete" style={{"backgroundColor": "red", "color": "white", "margin": "10px"}}
                  className="btn btn-default" onClick={handleDelete}>Delete
          </Button>
          <Button id="save" style={{"backgroundColor": "blue", "color": "white", "margin": "10px"}} className="btn btn-default btn-primary"
                  onClick={handleSave}>Save
          </Button>
        </form>}

        <Typography color="textSecondary">{id && id}</Typography>
        <Typography color="textSecondary">{player && player}</Typography>
      </Paper>
    </>
  );
}
