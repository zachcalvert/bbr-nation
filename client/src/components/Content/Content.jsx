import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { API_URL } from "../../constants"
import { Dialog, Divider, Slide, Typography } from '@material-ui/core';
import { FormattedTime } from '../Common'

import './Content.css'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const Content = (props) => {
  const { content } = props;
  const { kind } = content;
  const createdDate = FormattedTime(content.create_date);
  const [open, setOpen] = useState(false);

  const handleClick = async () => {
    const { data } = await axios.get(`${API_URL}content/${content.name}`)
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
          <Typography variant='h2'>Hi</Typography>
      </Dialog>

      {kind === 'IMAGE' && (
        <div onClick={handleClick} className='bbr-image'>
          <img src={content.upload} />
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          <Divider />
          <Typography variant='subtitle1'>{content.creator}, {createdDate}</Typography>
        </div>
      )}
      {kind === 'VIDEO' && (
        <div onClick={handleClick} className='bbr-video'>
          <video controls><source src={content.upload} type="video/mp4" /></video>
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          <Divider />
          <Typography variant='subtitle1'>{content.creator}, {createdDate}</Typography>
        </div>
      )}
      {kind === 'TEXT' && (
        <div onClick={handleClick} className='bbr-quote'>
          {content.text && <Typography variant='h6'>"{content.text}"</Typography>}
          <Divider />
          <Typography variant='subtitle1'>{content.creator}, {createdDate}</Typography>
        </div>
      )}
    </>
  )
};