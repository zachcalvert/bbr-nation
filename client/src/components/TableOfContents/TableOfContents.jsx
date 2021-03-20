import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios"
import { Divider, IconButton, Typography } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';

import { API_URL } from "../../constants"
import './TableOfContents.css'

const ITEM_HEIGHT = 50;

export const TableOfContents = () => {
  const PAGES_URL = `${API_URL}pages/`
  const [pages, setPages] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    async function fetchPages() {
      const { data } = await axios.get(PAGES_URL);
      setPages(data.results);        
    }
    fetchPages();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MenuRoundedIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 5.5,
            width: 'auto',
          },
        }}
      >
        {pages.map((page) => (
          <MenuItem 
            key={page.slug} 
            selected={page === 'Home'}
            onClick={handleClose}
            component={Link}
            to={page.slug}>
              <Typography variant='h6'>{page.name}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}
