import React, { useEffect, useState } from 'react'
import axios from "axios"
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';

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
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: 'auto',
          },
        }}
      >
        {pages.map((page) => (
          <MenuItem key={page.name} selected={page === 'Home'} onClick={handleClose}>
            {page.name}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}