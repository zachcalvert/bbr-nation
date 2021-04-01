import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios"
import { Avatar, Divider, IconButton, List, ListItem, ListItemText, ListItemIcon, Typography, makeStyles } from '@material-ui/core';
import PlayCircleOutlineOutlinedIcon from '@material-ui/icons/PlayCircleOutlineOutlined';
import ImageOutlinedIcon from '@material-ui/icons/ImageOutlined';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';
import './TableOfContents.css'

const PAGES_URL = `${process.env.REACT_APP_API_URL}/pages/`
const USERS_URL = `${process.env.REACT_APP_API_URL}/users/`
const ITEM_HEIGHT = 50;

const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
}));

export const TableOfContents = () => {
  const classes = useStyles();
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchPages() {
      const { data } = await axios.get(PAGES_URL);
      setPages(data.results);        
    }
    async function fetchUsers() {
      const { data } = await axios.get(USERS_URL);
      setUsers(data.results);        
    }
    fetchPages();
    fetchUsers();
  }, [PAGES_URL]);

  return (
    <>
      <List>
        {pages.map((page) => (
          <MenuItem 
            key={page.slug} 
            selected={page === 'Home'}
            component={Link}
            to={page.slug}>
              <Typography variant='h6'>{page.name}</Typography>
          </MenuItem>
        ))}
      </List>
      <Divider />
      <List>
        {users?.map((user, index) => (
          <MenuItem 
            key={user.username} 
            component={Link}
            to={`/u/${user.username}`}>
              <Avatar alt={user.username} src={user.avatar_url} />
              <Typography variant='h6'>{user.username}</Typography>
          </MenuItem>
        ))}
      </List>
    </>
  )
}
