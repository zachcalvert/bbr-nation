import React from "react";
import axios from "axios";
import { Button, Divider, makeStyles, Paper, TextField, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    paper: {
      padding: theme.spacing(2),
      height: "auto",
      position: 'relative'
    }
  })
);

export const Chat = () => {
  const classes = useStyles();
  const MESSAGE_URL = `${process.env.REACT_APP_DJANGO_URL}bot/new_message/`;
  const [request, setRequest] = React.useState(null);
  const [response, setResponse] = React.useState(null);

  async function createRequest() {
    const requestData = {
        name: "John", 
        sender_id: "30803449", 
        sender_type: "user",
        text: request,
        user_id: "30803449"
    }
    const { data } = await axios.post(MESSAGE_URL , requestData, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setResponse(data.text);
  }

  return (
    <Paper className={classes.paper} variant='outlined'>
      <form className={classes.root} noValidate autoComplete="off">
        <TextField
        id="standard-basic" 
        value={request}
        autoFocus={true}
        fullWidth={true}
        onChange={e => setRequest(e.target.value)}
        />

        <Divider />

        {response && <Typography color='secondary' variant='h6'>{response}</Typography>}
        <Button id="save" style={{"backgroundColor": "blue", "color": "white", "margin": "10px"}} className="btn btn-default btn-primary"
                onClick={createRequest}>Save
        </Button>
      </form>
    </Paper>
  );
}
