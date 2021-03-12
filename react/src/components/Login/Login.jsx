import React, { useState } from "react";
import { Fab, makeStyles, TextField, Typography } from '@material-ui/core';
import axios from "axios";

const LOGIN_URL = 'http://localhost:8000/api-auth/login/';

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center"
  },
  paddedText: {
    padding: "10px"
  }
}));


export const Login = ()  => {
  const classes = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {"username": username, "password": password}
    async function attemptLogin(data) {
      const response = await axios.post(LOGIN_URL, data);
      console.log(response);
      sessionStorage.setItem('username', username)
    }
    attemptLogin(data);
  }

  return (
    <div className={classes.root}>
    <Typography className={classes.paddedText} variant='subtitle2'>Login to join the chat</Typography>
      <form onSubmit={handleSubmit} className={classes.loginForm} noValidate autoComplete="off">
        <TextField 
          id="username" 
          label="username" 
          variant="outlined"
          onChange={e => setUsername(e.target.value.trim())} />
        <TextField 
          id="password" 
          label="password" 
          variant="outlined"
          type="password"
          onChange={e => setPassword(e.target.value.trim())} />
        <Fab variant="extended"
          style={{ padding: '20px', margin: '20px' }}
          color="primary"
          type="submit">
          Login
        </Fab>
      </form>
    </div>
  )
};