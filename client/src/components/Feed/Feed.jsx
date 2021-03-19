import React, { useEffect, useState } from 'react'
import axios from "axios"
import { API_URL } from "../../constants"
import { makeStyles, Paper, Typography } from '@material-ui/core';
import { FormattedTime } from '../Common'

import './Feed.css'

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: theme.spacing(2)
  }
}));

const FEED_URL = `${API_URL}content/`

export const Feed = () => {
  const classes = useStyles();
  const [content, setContent] = useState([]);
  const [isBottom, setIsBottom] = useState(false);

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

  async function fetchContent() {
    const { data } = await axios.get(FEED_URL);
    setContent([...content, ...data.results]);
    setIsBottom(false);
  }

  useEffect(() => {
    if (isBottom) {
      fetchContent();
    }
  }, [isBottom]);


  useEffect(() => {
    async function fetchContent() {
      const { data } = await axios.get(FEED_URL);
      setContent(data.results);
    }
    fetchContent();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderContent = (content) => {
    let createdDate = FormattedTime(content.create_date);

    if (content['kind'] === 'IMAGE') {
      return (
        <div className='bbr-image'>
          <img src={content.upload} />
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          <Typography variant='subtitle1'>{content.creator} - {createdDate}</Typography>
        </div>
      )
    } else if (content['kind'] === 'MOVIE') {
      return (
        <div className='bbr-video'>
          <video controls><source src={content.upload} type="video/mp4" /></video>
          <Typography variant='subtitle1'>{content.creator} - {createdDate}</Typography>
        </div>
      )
    } else {
      return (
        <div className='bbr-quote'>
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          <Typography variant='subtitle1'>{content.creator} - {createdDate}</Typography>
        </div>
        )
    }
  }

  return (
    <>
      {content.map((c, index) => (
        <Paper key={c.id} className={classes.paper}>
          {renderContent(c)}
        </Paper>
      ))}
    </>
  )
}