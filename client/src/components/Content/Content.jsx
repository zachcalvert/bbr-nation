import React from 'react';
import { Divider, Typography } from '@material-ui/core';

import { FormattedTime } from '../Common'
import './Content.css';

export const Content = (props) => {
  const { content } = props;
  const { kind } = content;

  return (
    <div>
      {kind === 'IMAGE' && (
          <div className='bbr-image'>
          <img alt='bbr-content' src={content.upload} />
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
    </div>
  )
};