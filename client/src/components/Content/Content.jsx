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
          <img alt='bbr-content' src={content.media_url} />
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
        </div>
      )}
      {kind === 'VIDEO' && (
        <iframe id={content.name} type="text/html" className='framed-video' src={content.media_url} frameBorder="0"></iframe>
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