import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { Avatar, Divider, Grid, makeStyles, Paper, Typography } from '@material-ui/core';

import { Feed } from '../Feed/Feed';

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 10px'
  },
  large: {
    width: theme.spacing(20),
    height: theme.spacing(20),
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
    position: 'relative'
  },
}));

export const Member = () => {
  const classes = useStyles();

  const { name } = useParams();
  const DETAIL_URL = `${process.env.REACT_APP_API_URL}/members/${name}/`
  const MEMBER_CONTENT_URL = `${process.env.REACT_APP_API_URL}/content/${name}/member`
  
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [nicks, setNicks] = useState([]);
  const nickname = nicks[Math.floor(Math.random() * nicks.length)];

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

    async function fetchUserDetails() {
      const { data } = await axios.get(DETAIL_URL);
      setAvatarUrl(data.avatar_url);
      setNicks(data.nicks);
    }
    fetchUserDetails();
  }, [DETAIL_URL, name]);

  return (
    <>
      <Paper className={classes.paper}>
        <Grid container spacing={1}>
          <Grid item>
            <Avatar className={classes.large} alt={name} src={avatarUrl} />
          </Grid>
          <Grid className={classes.leftAlign} item>
            <Typography variant='h3'>{name}</Typography>
            <Typography variant='h6'>aka {nickname}</Typography>
          </Grid>
        </Grid>
      </Paper>
      {/* {nicks.map((nick) => (
        <Typography variant='subtitle1'>{nick}</Typography>
      ))} */}

      <Feed url={MEMBER_CONTENT_URL} />
    </>
  )
}