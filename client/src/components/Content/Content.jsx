import React from 'react';
import { Divider, Typography } from '@material-ui/core';

import { FormattedDate } from '../Common'
import './Content.css';

export const Content = (props) => {
  const { content } = props;
  const { kind } = content;

  return (
    <div>
      {content.display_name && <Typography style={{textAlign: 'left'}} variant='h5'>{content.display_name}</Typography>}
      {kind === 'IMAGE' && (
        <div className='bbr-image'>
          <img src={content.upload} />
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          <Typography variant='subtitle1'>{content.creator} - {content.create_date}</Typography>
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
      {content.description ? (
        <Typography style={{textAlign: 'center'}} variant='h6'>{content.description}</Typography>
      ) : (
        <Typography variant='subtitle1'>{content.creator_nickname}, {FormattedDate(content.create_date)}</Typography>
      )}
    </div>
  )
};