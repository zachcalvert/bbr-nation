import React, { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import axios from "axios"
import { makeStyles, Paper } from '@material-ui/core';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';

import { Content } from '../Content/Content';
import { ContentModal } from '../Content/ContentModal';
import './Page.css'

const CONTENT_URL = `${process.env.REACT_APP_API_URL}/content`

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow:'scroll',
  },
  modalPaper: {
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    minWidth: '400px',
    borderRadius: '4px'
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: theme.spacing(4),
    position: 'relative'
  },
  date: {
    textAlign: 'right'
  },
  viewConversation: {
    margin: '0 auto',
    display: 'block'
  },
  share: {
    position: 'absolute',
    top: '5px',
    right: '5px'
  }
}));


export const Page = () => {
  const { slug } = useParams();
  const history = useHistory();
  const location = useLocation();
  const classes = useStyles();

  const [pageContent, setPageContent] = useState([]);
  const [nextUrl, setNexUrl] = useState(null);
  const [isBottom, setIsBottom] = useState(false);
  const [keepScrolling, setKeepScrolling] = useState(true);

  const [open, setOpen] = React.useState(false);
  const [activeContent, setActiveContent] = React.useState(null);

  let contentUrl;
  if (slug) {
    contentUrl = `${CONTENT_URL}/${slug}`;
  } else {
    contentUrl = `${CONTENT_URL}/random`;
  }

  async function fetchPageContent(url, append=true) {
    const { data } = await axios.get(url);
    if (!append) {
      setPageContent([]);
      setPageContent(data.results);
    } else {
      setPageContent([...pageContent, ...data.results]);
    }
    setIsBottom(false);
    if (!data.next) {
      setKeepScrolling(false);
    }
    setNexUrl(data.next);
  }

  async function fetchContentDetails(name) {
    const { data } = await axios.get(`${API_URL}content/${name}`);
    setActiveContent(data);
  }

  // first load
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
    fetchPageContent(contentUrl, false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const contentName = urlParams.get('content');
    if (contentName) {
      fetchContentDetails(contentName)
      setOpen(true);
    }
  }, [slug]);

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
      fetchPageContent(nextUrl);
    }
  }, [isBottom]);

  const handleClick = (content, e) => {
    setActiveContent(content);
    setOpen(true);
    history.push({
      search: `?content=${content.name}`
    })
    document.activeElement.blur();
  };

  // modal stuff
  const handleClose = () => {
    setOpen(false);
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has('content')) {
      queryParams.delete('content')
      history.replace({
        search: '',
      })
    }
  };

  return (
    <>
      {pageContent.map((c) => (
        <Paper className={classes.paper}>
          <ZoomOutMapIcon className={classes.share} onClick={(e) => handleClick(c, e)} />
          <Content key={c.id} content={c} />
        </Paper>
      ))}
      
      {open && activeContent && <ContentModal open={open} handleClose={handleClose} activeContent={activeContent} />}
    </>
  )
}