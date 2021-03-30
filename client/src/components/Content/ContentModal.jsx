import React, { useEffect } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Backdrop, Dialog, Divider, Grid, makeStyles, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import axios from "axios"
import ExpandLessRoundedIcon from '@material-ui/icons/ExpandLessRounded';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import { useSpring, animated } from 'react-spring/web.cjs';

import { GroupMeMessage } from '../Content/GroupMeMessage'
import { FormattedTime } from '../Common'
import './ContentModal.css'

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
      borderRadius: '4px'
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

export const ContentModal = (props) => {
  const classes = useStyles();
  const { open } = props;
  const { handleClose } = props;
  const { activeContent } = props;
  const [conversation, setConversation] = React.useState([]);

  async function fetchConversation(name) {
    const { data } = await axios.get(`${CONTENT_URL}/${name}/conversation/`)
    setConversation(data);
  }

  useEffect(() => {
    fetchConversation(activeContent.name);
  }, [activeContent]);

  return (
    <Dialog
      className={classes.modal}
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}>
    <Fade in={open}>
      <div className={classes.modalPaper}>
        {activeContent && (
          <>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandLessRoundedIcon fontSize='large' />}
              aria-controls="panel2a-content"
              id="panel2a-header">
            </AccordionSummary>
            <AccordionDetails>
              {conversation && conversation.map((message, index) => (
                <GroupMeMessage key={index} message={message} />
              ))}
            </AccordionDetails>
          </Accordion>

          <Grid container>
            <Grid item xs={12}>
              <div className='creator'>
                <img className={classes.avatar} src={activeContent.avatar_url} />
                <Typography variant='subtitle1' className='creator-name'>{activeContent.creator}</Typography> 
              </div>
              <div className='likes'>
                <Typography style={{ color: '#FFAEB9' }} variant='h5'>{activeContent.likes}</Typography>
                <FavoriteBorderIcon style={{ color: '#FFAEB9', marginTop: '4px' }} />
              </div>
              <Divider style={{ backgroundColor: 'transparent', clear: "both" }} />
              {activeContent.kind === 'IMAGE' && (
                <div className='bbr-modal-image'>
                  <img alt='bbr-content' src={activeContent.media_url} />
                </div>
              )}
              {activeContent.kind === 'VIDEO' && (
                <iframe id={activeContent.name} type="text/html" class='framed-video' src={activeContent.media_url} frameborder="0"></iframe>
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
  )
}