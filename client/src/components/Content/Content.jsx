import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from "axios"
import { Backdrop, Dialog, Divider, Grid, makeStyles, Paper, Typography } from '@material-ui/core';
import { useSpring, animated } from 'react-spring/web.cjs';

import { FormattedTime } from '../Common'
import { API_URL } from "../../constants"
import './Content.css';

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

export const Content = (props) => {
  const location = useLocation();
  const { content } = props;
  const { kind } = content;
  const classes = useStyles();
  const history = useHistory();
  const [conversation, setConversation] = React.useState([]);
  const [open, setOpen] = React.useState(false);

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

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const content = urlParams.get('content');
    if (content) {
      fetchConversation();
      setOpen(true);
    }
  }, []);

  const renderContent = (content) => {
    return (
      <>
       <Typography variant='subtitle1'>{content.creator}</Typography>
        {content.kind === 'IMAGE' && (
          <div className='bbr-image'>
            <img src={content.upload} />
          </div>
        )}
        {content.kind === 'VIDEO' && (
          <div className='bbr-video'>
            <video controls><source src={content.upload} type="video/mp4" /></video>
          </div>
        )}
        {content.text && <Typography variant='h4'>{content.text}</Typography>}
        <Typography className={classes.date} variant='subtitle2'>{FormattedTime(content.create_date)}</Typography>
      </>
    )
  }

  async function fetchConversation() {
    const { data } = await axios.get(`${API_URL}content/${content.name}/conversation`)
    setConversation(data);
  }

  const handleClick = (e) => {
    setOpen(true);
    history.push({
      search: `?content=${content.name}`
    })
    fetchConversation();
    document.activeElement.blur();
  };

  return (
    <div>
      <Paper className={classes.paper} onClick={handleClick}>
        {kind === 'IMAGE' && (
            <div className='bbr-image'>
            <img src={content.upload} />
            {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
            </div>
        )}
        {kind === 'VIDEO' && (
          <div className='bbr-video'>
            <video controls><source src={content.upload} type="video/mp4" /></video>
          </div>
        )}
        {kind === 'TEXT' && (
          <div className='bbr-quote'>
            {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          </div>
        )}
        <Divider />
        <Typography variant='subtitle1'>{content.creator}, {FormattedTime(content.create_date)}</Typography>
      </Paper>
      <Dialog
        aria-labelledby="spring-modal-title"
        aria-describedby="spring-modal-description"
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
          <Grid item xs={2} ><img className={classes.avatar} src={message.avatar_url} /></Grid>
          <Grid item xs={10} >
            <Typography variant='subtitle1'>{message.creator}</Typography>
            {message.text && <Typography variant='h6'>{message.text}</Typography>}
          </Grid>
        </Grid>
        <Typography className={classes.date} variant='subtitle2'>{FormattedTime(message.created_date)}</Typography>
        <Divider />
        </>
      ))}
      {renderContent(content)}
          </div>
        </Fade>
      </Dialog>
      </div>
  )
};