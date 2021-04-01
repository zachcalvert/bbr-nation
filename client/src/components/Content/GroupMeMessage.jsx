import React from 'react';
import { Avatar, Divider, Grid, Typography, makeStyles } from '@material-ui/core';
import { FormattedTime } from '../Common'

import './ContentModal.css';

const useStyles = makeStyles((theme) => ({
  date: {
    textAlign: 'right'
  }
}));

export const GroupMeMessage = (props) => {
  const classes = useStyles();
  const { message } = props;
  const [avatarUrl, setAvatarUrl] = React.useState(null);
  const [imageUrl, setImageUrl] = React.useState(null);
  const [videoUrl, setVideoUrl] = React.useState(null);
  const [fromGroupMe, setFromGroupMe] = React.useState(false);

  React.useEffect(() => {
    console.log(message)

    if (message.attachments && message.attachments.length > 0) {

      if (message.attachments[0]?.type === 'image') {
        setImageUrl(message.attachments[0].url)
      }

      if (message.attachments[0]?.type === 'video') {
        setVideoUrl(message.attachments[0].url)
      }
    }

    if (message.creator === 'GroupMe') {
      setFromGroupMe(true);
    }
    if (message.avatar_url) {
      setAvatarUrl(message.avatar_url)
    }

  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          {fromGroupMe ? (
              <Typography variant='subtitle'>{message.text}</Typography>
            ) : (
              <>
                <div className='creator'>
                  <Avatar alt={message.name} src={avatarUrl} />
                  <Typography variant='subtitle2' className='creator-name'>{message.creator}</Typography> 
                </div>

                <Divider style={{ backgroundColor: 'transparent', clear: "both" }} />

                { imageUrl && <div className='bbr-modal-image'>
                  <img alt='bbr-content' src={imageUrl} />
                </div>}

                { videoUrl && <iframe id={message.id} type="text/html" class='framed-video' src={videoUrl} frameborder="0"></iframe>}

                {message.text && <Typography variant='subtitle1'>{message.text}</Typography>}
              </>
            )
          }
        </Grid>
      </Grid>
      <Typography className={classes.date} variant='subtitle2'>{FormattedTime(message.created_date)}</Typography>
      <Divider />
    </>
  )
}