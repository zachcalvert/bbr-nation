import React from "react";
import axios from "axios";
import { Button, Divider, FormGroup, makeStyles, Paper, Slide, Snackbar, Typography } from '@material-ui/core';
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

export const Word = () => {
  const classes = useStyles();
  const WORD_URL = `${process.env.REACT_APP_DJANGO_URL}api/words/`;
  const [id, setId] = React.useState(null);
  const [word, setWord] = React.useState(null);
  const [pos, setPos] = React.useState(null);
  const [tense, setTense] = React.useState(null);
  const [snackBarOpen, setSnackBarOpen] = React.useState(false);

  async function fetchRandomWord() {
    const { data } = await axios.get(WORD_URL + 'random/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setId(data.results[0].id);
    setWord(data.results[0].name);
  }

  React.useEffect(() => {
    fetchRandomWord();
  }, [])

  async function handleSave() {
    let putData = {
        name: word,
        pos: pos,
        tense: tense
    }
    const { status } = await axios.put(WORD_URL + `${id}/`, putData, {
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
    fetchRandomWord();
  }

  function TransitionDown(props) {
    return <Slide {...props} direction="down" />;
  }

  const handlePos = (event, newPos) => {
    console.log(newPos);
    setPos(newPos);
  };


  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackBarOpen}
        TransitionComponent={TransitionDown}
        message={`Word saved!`}
        key='link-copied-snackbar' />

      <Paper className={classes.paper} variant='outlined'>
        {id && <form className={classes.root} noValidate autoComplete="off">
          <Typography variant="subtitle1">{word}</Typography>

          <FormGroup row className={classes.formGroup}>
            <ToggleButtonGroup
              value={pos}
              exclusive
              onChange={handlePos}
              aria-label="sentiment">
              <ToggleButton value="NOUN" aria-label="neutral">noun</ToggleButton>
              <ToggleButton value="PRONOUN" aria-label="centered">pronoun</ToggleButton>
              <ToggleButton value="VERB" aria-label="right aligned">verb</ToggleButton>
              <ToggleButton value="ADJECTIVE" aria-label="positive">adjective</ToggleButton>
              <ToggleButton value="ADVERB" aria-label="neutral">adverb</ToggleButton>
              <ToggleButton value="PREPOSITION" aria-label="centered">preposition</ToggleButton>
              <ToggleButton value="CONJUCTION" aria-label="right aligned">conjuction</ToggleButton>
              <ToggleButton value="INTERJECTION" aria-label="positive">interjection</ToggleButton>
            </ToggleButtonGroup>
          </FormGroup>

          <Divider />

          <Button id="save" style={{"backgroundColor": "blue", "color": "white", "margin": "10px"}} className="btn btn-default btn-primary"
                  onClick={handleSave}>Save
          </Button>
        </form>}
      </Paper>
    </>
  );
}
