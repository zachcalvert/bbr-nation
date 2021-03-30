// {
// 	'attachments': [{
// 		'type': 'image',
// 		'url': 'https://i.groupme.com/1125x2436.jpeg.af9b851d0c1243c6a27876b35e9125e4'
// 	}],
// 	'avatar_url': 'https://i.groupme.com/1024x1024.jpeg.8f0eac552b9d47629c9eef4fc1976208',
// 	'created_at': 1610469571,
// 	'favorited_by': ['4689709'],
// 	'group_id': '16191637',
// 	'id': '161046957171877000',
// 	'name': 'Goldirocks and Da 3 Bears',
// 	'sender_id': '30837253',
// 	'sender_type': 'user',
// 	'source_guid': '5DB65D19-D9F9-418D-9F3C-5928E6C3C2F8',
// 	'system': False,
// 	'text': 'This popped up on my Snapchat memories today lol',
// 	'user_id': '30837253',
// 	'platform': 'gm'
// }

// {
// 	'attachments': [{
// 		'preview_url': 'https://v.groupme.com/16191637/2021-01-20T02:20:44Z/4dd95e9a.1920x1080r.jpg',
// 		'type': 'video',
// 		'url': 'https://v.groupme.com/16191637/2021-01-20T02:20:44Z/4dd95e9a.1920x1080r.mp4'
// 	}],
// 	'avatar_url': 'https://i.groupme.com/1672x2048.png.4fbaa4ec3d9b4b82816938b008cd1d9e',
// 	'created_at': 1611109278,
// 	'favorited_by': ['30833338', '30837252', '30837259', '4689709'],
// 	'group_id': '16191637',
// 	'id': '161110927846205209',
// 	'name': 'Just Kick My Bass',
// 	'sender_id': '30803449',
// 	'sender_type': 'user',
// 	'source_guid': 'android-b52531ab-1b48-473e-b0da-00d4e04be648',
// 	'system': False,
// 	'text': 'Hello! An important announcement. Imo we all owe rene a shotty for making such a crucial addition to the BBR lore https://v.groupme.com/16191637/2021-01-20T02:20:44Z/4dd95e9a.1920x1080r.mp4',
// 	'user_id': '30803449',
// 	'platform': 'gm'
// }



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
  const classes = useStyles();
  const { message } = props;
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
                  <img className='avatar' src={message.avatar_url} />
                  <Typography variant='subtitle1' className='creator-name'>{message.creator}</Typography> 
                </div>

                <Divider style={{ backgroundColor: 'transparent', clear: "both" }} />

                { imageUrl && <div className='bbr-modal-image'>
                  <img alt='bbr-content' src={imageUrl} />
                </div>}

                { videoUrl && <iframe id={message.id} type="text/html" class='framed-video' src={videoUrl} frameborder="0"></iframe>}

                {message.text && <Typography variant='h6'>{message.text}</Typography>}
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