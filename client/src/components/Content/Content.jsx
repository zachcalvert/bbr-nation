import React from 'react';
import { Divider, Link, Typography } from '@material-ui/core';

import { FormattedTime } from '../Common'
import './Content.css';

export const Content = (props) => {
  const { content } = props;
  const { kind } = content;

  return (
    <div>
      {kind === 'IMAGE' && (
        <div className='bbr-image'>
          <img alt='bbr-content' src={content.media_url} />
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
        </div>
      )}
      {kind === 'VIDEO' && (
        <iframe id={content.name} type="text/html" className='framed-video' src={content.media_url} frameborder="0"></iframe>
      )}
      {kind === 'TEXT' && (
        <div className='bbr-quote'>
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
        </div>
      )}
      <Divider />
        <Typography variant='subtitle1'>{content.creator_nickname}, {FormattedTime(content.create_date)}</Typography>    
    </div>
  )
};