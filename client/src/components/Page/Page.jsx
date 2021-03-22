import React, { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from "axios"
import { Backdrop, Button, Dialog, Divider, Grid, makeStyles, Paper, Typography } from '@material-ui/core';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';
import ExpandLessRoundedIcon from '@material-ui/icons/ExpandLessRounded';
import { useSpring, animated } from 'react-spring/web.cjs';

import { FormattedTime } from '../Common'
import { API_URL } from "../../constants"
import { Content } from '../Content/Content';
import './Page.css'

const FEED_URL = `${API_URL}content/`

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
  avatar: {
    height: 'auto',
    width: '50px'
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

const Fade = React.forwardRef(function Fade(props, ref) {
  const { in: open, children, onEnter, onExited, ...other } = props;
  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: open ? 1 : 0 },
    onStart: () => {
      if (open && onEnter) {
        onEnter();
      }
    },
    onRest: () => {
      if (!open && onExited) {
        onExited();
      }
    },
  });

  return (
    <animated.div ref={ref} style={style} {...other}>
      {children}
    </animated.div>
  );
});

Fade.propTypes = {
  children: PropTypes.element,
  in: PropTypes.bool.isRequired,
  onEnter: PropTypes.func,
  onExited: PropTypes.func,
};

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
  const [conversation, setConversation] = React.useState([]);

  let contentUrl;
  if (slug) {
    contentUrl = `${FEED_URL}${slug}`;
  } else {
    contentUrl = `${FEED_URL}random`;
  }

  async function fetchPageContent(url, append=true) {
    const { data } = await axios.get(url);
    if (!append) {
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

  async function fetchConversation(name) {
    const { data } = await axios.get(`${API_URL}content/${name}/conversation/`)
    setConversation(data);
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
      fetchContentDetails(contentName);
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


  // modal stuff
  const handleClose = () => {
    setOpen(false);
    setActiveContent(null);
    setConversation([]);
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has('content')) {
      queryParams.delete('content')
      history.replace({
        search: '',
      })
    }
  };

  const handleClick = (content, e) => {
    setOpen(true);
    setActiveContent(content)
    history.push({
      search: `?content=${content.name}`
    })
    document.activeElement.blur();
  };

  return (
    <>
      {pageContent.map((c) => (
        <Paper className={classes.paper}>
          <ZoomOutMapIcon className={classes.share} onClick={(e) => handleClick(c, e)} />
          <Content key={c.id} content={c} />
        </Paper>
      ))}
      <Dialog
        className={classes.modal}
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <div className={classes.modalPaper}>
            {activeContent && conversation.length === 0 && <Button className={classes.viewConversation} onClick={() => fetchConversation(activeContent.name)}>
              <ExpandLessRoundedIcon fontSize='large' />
            </Button>}
            {conversation && conversation.map((message, index) => (
              <>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography variant='subtitle2'>{message.creator}</Typography>
                    {message.text && <Typography variant='h6'>{message.text}</Typography>}
                  </Grid>
                </Grid>
                <Typography className={classes.date} variant='subtitle2'>{FormattedTime(message.created_date)}</Typography>
                <Divider />
              </>
            ))}
            {activeContent && (
              <>
              <Grid container>
                <Grid item xs={12}>
                  <Typography variant='subtitle1'>{activeContent.creator}</Typography>
                  {activeContent.kind == 'IMAGE' && (
                    <div className='bbr-image'>
                      <img src={activeContent.upload} />
                    </div>
                  )}
                  {activeContent.kind == 'VIDEO' && (
                    <div className='bbr-video'>
                      <video controls><source src={activeContent.upload} type="video/mp4" /></video>
                    </div>
                  )}
                  {activeContent.text && <Typography variant='h6'>{activeContent.text}</Typography>}
                </Grid>
              </Grid>
              <Typography className={classes.date} variant='subtitle2'>{FormattedTime(activeContent.create_date)}</Typography>
              </>
            )}
          </div>
        </Fade>
      </Dialog>
    </>
  )
}