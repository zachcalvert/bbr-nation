import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { API_URL } from "../../constants"
import { makeStyles, Paper, Typography } from '@material-ui/core';
import { FormattedTime } from '../Common'

import './Page.css'

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

export const Page = () => {
  const classes = useStyles();
  const { slug } = useParams();
  const [content, setContent] = useState([]);
  const [isBottom, setIsBottom] = useState(false);
  const [nextUrl, setNexUrl] = useState(null);
  const [keepScrolling, setKeepScrolling] = useState(true);

  let contentUrl;
  if (slug) {
    contentUrl = `${FEED_URL}${slug}`;
  } else {
    contentUrl = FEED_URL;
  }

  useEffect(() => {
    setContent([]);

    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    async function fetchContent() {
      const { data } = await axios.get(contentUrl);
      setContent(data.results);
      if (data.next) {
        setNexUrl(data.next);
      } else {
        setKeepScrolling(false);
      }
    }
    fetchContent();
  }, [slug]);

  // add scroll listener to detect if we've reach the bottom of the page
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
      fetchContent(nextUrl);
    }
  }, [isBottom]);

  async function fetchContent(url) {
    const { data } = await axios.get(url);
    setContent([...content, ...data.results]);
    setIsBottom(false);
    if (!data.next) {
      setKeepScrolling(false);
    }
    setNexUrl(data.next);
  }

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
    } else if (content['kind'] === 'VIDEO') {
      return (
        <div className='bbr-video'>
          <video controls><source src={content.upload} type="video/mp4" /></video>
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
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