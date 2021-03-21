import React, { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from "axios"
import { Backdrop, Dialog, Divider, Grid, makeStyles, Paper, Typography } from '@material-ui/core';
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
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: theme.spacing(4)
  },
  avatar: {
    height: 'auto',
    width: '50px'
  },
  date: {
    textAlign: 'right'
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
  const [isBottom, setIsBottom] = useState(false);
  const [nextUrl, setNexUrl] = useState(null);
  const [keepScrolling, setKeepScrolling] = useState(true);
  const [conversation, setConversation] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [activeContent, setActiveContent] = React.useState(null);

  let contentUrl;
  if (slug) {
    contentUrl = `${FEED_URL}${slug}`;
  } else {
    contentUrl = `${FEED_URL}random`;
  }

  async function fetchPageContent(url) {
    const { data } = await axios.get(url);
    setPageContent([...pageContent, ...data.results]);
    setIsBottom(false);
    if (!data.next) {
      setKeepScrolling(false);
    }
    setNexUrl(data.next);
  }

  async function fetchConversation(name) {
    const { data } = await axios.get(`${API_URL}content/${name}/conversation`)
    setConversation(data);
  }

  async function fetchContentDetails(name) {
    const { data } = await axios.get(`${API_URL}content/${name}`);
    setActiveContent(data);
  }

  // first load
  useEffect(() => {
    setPageContent([]);
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }
    fetchPageContent(contentUrl);
    
    const urlParams = new URLSearchParams(window.location.search);
    const contentName = urlParams.get('content');

    if (contentName) {
      fetchContentDetails(contentName);
      fetchConversation(contentName);
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
    fetchConversation(content.name);
    document.activeElement.blur();
  };

  return (
    <>
      {pageContent.map((c) => (
        <Paper className={classes.paper} onClick={(e) => handleClick(c, e)}>
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
            {conversation.map((message, index) => (
              <>
                <Grid container>
                  <Grid item xs={2}><img className={classes.avatar} src={message.avatar_url} /></Grid>
                  <Grid item xs={10}>
                    <Typography variant='subtitle1'>{message.creator}</Typography>
                    {message.text && <Typography variant='h6'>{message.text}</Typography>}
                  </Grid>
                </Grid>
                <Typography className={classes.date} variant='subtitle2'>{FormattedTime(message.created_date)}</Typography>
                <Divider />
              </>
            ))}
            {activeContent && <Content content={activeContent} />}
          </div>
        </Fade>
      </Dialog>
    </>
  )
}