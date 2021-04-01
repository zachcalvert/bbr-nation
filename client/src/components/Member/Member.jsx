import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { Avatar, Grid, makeStyles, Paper, Typography } from '@material-ui/core';

import { Content } from '../Content/Content';

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
    marginTop: theme.spacing(4),
    position: 'relative'
  },
}));

export const Member = () => {
  const { name } = useParams();
  const classes = useStyles();
  const DETAIL_URL = `${process.env.REACT_APP_API_URL}/members/${name}/`
  const MEMBER_CONTENT_URL = `${process.env.REACT_APP_API_URL}/content/${name}/member`
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [nicks, setNicks] = useState([]);
  const nickname = nicks[Math.floor(Math.random() * nicks.length)];
  const [content, setContent] = useState([]);
  const [nextUrl, setNexUrl] = useState(null);
  const [isBottom, setIsBottom] = useState(false);
  const [keepScrolling, setKeepScrolling] = useState(true);

  async function fetchMemberContent() {
    const { data } = await axios.get(MEMBER_CONTENT_URL);
    setContent(data.results); 
  }

  async function fetchMemberContent(url, append=true) {
    const { data } = await axios.get(url);
    if (!append) {
      setContent([]);
      setContent(data.results);
    } else {
      setContent([...content, ...data.results]);
    }
    setIsBottom(false);
    if (!data.next) {
      setKeepScrolling(false);
    }
    setNexUrl(data.next);
  }

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
    fetchMemberContent(MEMBER_CONTENT_URL, false)
  }, [DETAIL_URL, name]);

  // scroll stuff
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleScroll() {
    const scrollTop = (document.documentElement
      && document.documentElement.scrollTop)
      || document.body.scrollTop;
    const scrollHeight = (document.documentElement
      && document.documentElement.scrollHeight)
      || document.body.scrollHeight;
    if (scrollTop + window.innerHeight + 50 >= scrollHeight){
      setIsBottom(true);
    }
  }

  useEffect(() => {
    if (isBottom && keepScrolling) {
      fetchMemberContent(nextUrl);
    }
  }, [isBottom]);

  return (
      <>
      <Grid className={classes.container} container spacing={1}>
        <Grid item>
          <Avatar className={classes.large} alt={name} src={avatarUrl} />
        </Grid>
        <Grid className={classes.leftAlign} item>
          <Typography variant='h3'>{name}</Typography>
          <Typography variant='h6'>aka {nickname}</Typography>
        </Grid>
      </Grid>

        {/* {nicks.map((nick) => (
          <Typography variant='subtitle1'>{nick}</Typography>
        ))} */}

        {content.map((c) => (
          <Paper className={classes.paper}>
            <Content key={c.id} content={c} />
          </Paper>
        ))}
      </>
  )
}