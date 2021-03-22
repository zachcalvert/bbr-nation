import React from 'react';
import { Divider, Grid, Typography, makeStyles } from '@material-ui/core';
import { FormattedTime } from '../Common'

import './ContentModal.css';

const useStyles = makeStyles((theme) => ({
  date: {
    textAlign: 'right'
  }
}));

export const GroupMeMessage = (props) => {
  const { message } = props;
  const classes = useStyles();
  const [loadingAttachment, setLoadingAttachment] = React.useState(false);
  const isVideo = message.text?.includes('v.groupme.com');

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <div className='creator'>
            <img className='avatar' src={message.avatar_url} />
            <Typography variant='subtitle1' className='creator-name'>{message.creator}</Typography> 
          </div>
          <Divider style={{ backgroundColor: 'transparent', clear: "both" }} />
          {message.text && <Typography variant='h6'>{message.text}</Typography>}
          {isVideo && <span>attachment</span>}
        </Grid>
      </Grid>
      <Typography className={classes.date} variant='subtitle2'>{FormattedTime(message.created_date)}</Typography>
      <Divider />
    </>
  )
}