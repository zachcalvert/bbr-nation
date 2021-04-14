import React from 'react';
import { Typography } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import { FormattedDate } from '../Common'
import './Content.css';

const useStyles = makeStyles({
  root: {
    minWidth: 200,
    maxWidth: '100%',
    padding: '0 15px'
  },
  title: {
    fontSize: 24,
  },
  pos: {
    marginBottom: 12,
  },
});

export const Content = (props) => {
  const classes = useStyles();
  const { content } = props;
  const { kind } = content;

  return (

    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Typography className={classes.title} color="textSecondary" gutterBottom>
          {content.display_name}
        </Typography>
      
        {kind === 'IMAGE' && (
          <div className='bbr-image'>
            <img src={content.upload} />
            {content.text && <Typography style={{textAlign: 'center'}} variant='h6'>"{content.text}"</Typography>}
          </div>
        )}
        
        {kind === 'VIDEO' && (
          <div className='bbr-video'>
            <video controls autoPlay loop muted playsInline><source src={content.upload} type="video/mp4" /></video>
            {content.text && <Typography style={{textAlign: 'center'}} variant='h6'>"{content.text}"</Typography>}
          </div>
        )}
        
        {kind === 'TEXT' && 
          <Typography variant="h5" component="h2">
            "{content.text}"
          </Typography>
        }
      
    </CardContent>
    <CardActions>
    <Typography className={classes.pos} color="textSecondary">
        {content.creator_nickname}, {FormattedDate(content.create_date)}
      </Typography>
      <Typography variant="body2" component="p">
        {content.description}
      </Typography>
    </CardActions>
    </Card>
  )
};