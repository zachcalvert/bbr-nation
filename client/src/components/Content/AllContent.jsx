import React from 'react';
import { Divider, Typography } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import WhatshotIcon from '@material-ui/icons/Whatshot';
import HelpRoundedIcon from '@material-ui/icons/HelpRounded';
import UpdateRoundedIcon from '@material-ui/icons/UpdateRounded';
import RestoreRoundedIcon from '@material-ui/icons/RestoreRounded';

import { Feed } from '../Feed/Feed';

const CONTENT_URL = `${process.env.REACT_APP_DJANGO_URL}api/content/`;


export const AllContent = () => {
  const [url, setUrl] = React.useState(CONTENT_URL);
  const [order, setOrder] = React.useState('?');

  const handleOrderingChange = (event, newOrder) => {
    setOrder(newOrder);
    setUrl(`${CONTENT_URL}?ordering=${newOrder}`)
  };
  
  return (
    <>
      <ToggleButtonGroup
        value={order}
        exclusive
        onChange={handleOrderingChange}
        aria-label="content-sorter">
        <ToggleButton value="?" aria-label="left aligned">
          <Typography variant='h6'><HelpRoundedIcon /></Typography>
        </ToggleButton>
        <ToggleButton value="-likes" aria-label="centered">
        <Typography variant='h6'><WhatshotIcon /></Typography>
        </ToggleButton>
        <ToggleButton value="-create_date" aria-label="right aligned">
        <Typography variant='h6'><UpdateRoundedIcon /></Typography>
        </ToggleButton>
        <ToggleButton value="create_date" aria-label="justified">
          <Typography variant='h6'><RestoreRoundedIcon /></Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      
      <Feed url={url}/>
    </>
  );
}

