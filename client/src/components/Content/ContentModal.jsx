import React, { useEffect } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Backdrop, Dialog, Grid, Link, makeStyles, Slide, Snackbar } from '@material-ui/core';
import PropTypes from 'prop-types';
import axios from "axios"
import EditRoundedIcon from '@material-ui/icons/EditRounded';
import ExpandLessRoundedIcon from '@material-ui/icons/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@material-ui/icons/ExpandMoreRounded';
import ShareIcon from '@material-ui/icons/Share';
import { useSpring, animated } from 'react-spring/web.cjs';
import { useClipboard } from 'use-clipboard-copy';

import { Content } from './Content'
import { GroupMeMessage } from '../Content/GroupMeMessage'

import './ContentModal.css'

const CONTENT_URL = `${process.env.REACT_APP_DJANGO_URL}api/content`
const ADMIN_URL = `${process.env.REACT_APP_DJANGO_URL}admin/`

const useStyles = makeStyles((theme) => ({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow:'scroll',
    },
    modalPaper: {
      backgroundColor: '#303030',
      boxShadow: theme.shadows[5],
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
      paddingTop: theme.spacing(1),
      borderRadius: '4px'
    },
    accordion: {
      background: '#303030'
    },
    date: {
      textAlign: 'right'
    },
    viewConversation: {
      margin: '0 auto',
      display: 'block'
    },
    creatorName: {
      margin: 'auto 10px'
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
  const clipboard = useClipboard();
  const [precedingConversation, setPrecedingConversation] = React.useState([]);
  const [ensuingConversation, setEnsuingConversation] = React.useState([]);
  const [snackBarOpen, setSnackBarOpen] = React.useState(false);

  async function fetchConversation(name, ensuing=false) {
    if (ensuing) {
      const { data } = await axios.get(`${CONTENT_URL}/${name}/conversation/?ensuing=true`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      })
      setEnsuingConversation(data);
    } else {
      const { data } = await axios.get(`${CONTENT_URL}/${name}/conversation/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      })
      setPrecedingConversation(data);
    }

  }

  useEffect(() => {
    fetchConversation(activeContent.name);
    fetchConversation(activeContent.name, true);
  }, [activeContent]);

  function TransitionDown(props) {
    return <Slide {...props} direction="down" />;
  }

  const handleShareClick = () => {
    clipboard.copy();
    setSnackBarOpen(true);
    setTimeout(function (){
      setSnackBarOpen(false)
    }, 2000);
  };

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
          <Accordion className={classes.accordion}>
            <AccordionSummary
              expandIcon={<ExpandLessRoundedIcon fontSize='large' />}
              aria-controls="panel2a-content"
              id="panel2a-header"
              className="modalAccordion">
            </AccordionSummary>
            <AccordionDetails>
              {precedingConversation && precedingConversation.map((message, index) => (
                <GroupMeMessage key={index} message={message} />
              ))}
            </AccordionDetails>
          </Accordion>

          <Grid container>
            <Grid item xs={12}>
              <div className='copy-link'>
                <input ref={clipboard.target} value={window.location.href} readOnly hidden />
                <Link color='textSecondary' href={`${ADMIN_URL}content/content/${activeContent.id}/change`} target="_blank" style={{cursor: 'pointer'}}>
                  <EditRoundedIcon />
                </Link>
                <ShareIcon color="textSecondary" onClick={handleShareClick} style={{marginLeft: '10px', cursor: 'pointer'}} />
                <Snackbar
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  open={snackBarOpen}
                  onClose={handleClose}
                  TransitionComponent={TransitionDown}
                  message="Link copied!"
                  key='link-copied-snackbar'
                />
              </div>
              <Content key={activeContent.id} content={activeContent} showLikes={true} />
            </Grid>
          </Grid>

          <Accordion className={classes.accordion}>
            <AccordionSummary
              expandIcon={<ExpandMoreRoundedIcon fontSize='large' />}
              aria-controls="panel2a-content"
              id="panel2a-header"
              className="modalAccordion">
            </AccordionSummary>
            <AccordionDetails>
              {ensuingConversation && ensuingConversation.map((message, index) => (
                <GroupMeMessage key={index} message={message} />
              ))}
            </AccordionDetails>
          </Accordion>
        </>
      )}
      </div>
    </Fade>
  </Dialog>
  )
}