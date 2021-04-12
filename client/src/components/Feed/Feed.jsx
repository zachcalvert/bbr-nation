import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import axios from "axios"
import { Divider, makeStyles, Paper } from '@material-ui/core';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';

import { Content } from '../Content/Content';
import { ContentModal } from '../Content/ContentModal';
import './Feed.css'

const CONTENT_URL = `${process.env.REACT_APP_DJANGO_URL}api/content`

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
    marginTop: 0,
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


export const Feed = (props) => {
  const { url } = props;
  const history = useHistory();
  const location = useLocation();
  const classes = useStyles();

  const [content, setContent] = useState([]);
  const [activeContent, setActiveContent] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  const [nextUrl, setNexUrl] = useState(null);
  const [isBottom, setIsBottom] = useState(false);
  const [keepScrolling, setKeepScrolling] = useState(true);

  async function fetchContent(url, append=true) {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    
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

  async function fetchContentDetails(name) {
    const { data } = await axios.get(`${CONTENT_URL}/${name}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
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
    fetchContent(url, false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const contentName = urlParams.get('content');
    if (contentName) {
      fetchContentDetails(contentName)
      setOpen(true);
    }
  }, [url]);

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
    if (isBottom && keepScrolling && nextUrl) {
      fetchContent(nextUrl);
    }
  }, [isBottom, keepScrolling, nextUrl]);

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
      {content.map((c) => (
        <div className='content' key={c.name}>
          <Divider />
          <Paper className={classes.paper}>
            <ZoomOutMapIcon className={classes.share} onClick={(e) => handleClick(c, e)} />
            <Content key={c.id} content={c} />
          </Paper>
        </div>
      ))}
      
      {open && activeContent && <ContentModal open={open} handleClose={handleClose} activeContent={activeContent} />}
    </>
  )
}