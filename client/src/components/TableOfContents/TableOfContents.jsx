import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios"
import { Avatar, Divider, List, Typography, makeStyles } from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';

const PAGES_URL = `${process.env.REACT_APP_API_URL}/pages/`
const MEMBERS_URL = `${process.env.REACT_APP_API_URL}/members/`

const useStyles = makeStyles((theme) => ({
  memberName: {
    paddingLeft: theme.spacing(1),
  },
  menuHeader: {
    padding: '6px 6px 6px 16px',
  }
}));

export const TableOfContents = () => {
  const classes = useStyles();
  const [pages, setPages] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function fetchPages() {
      const { data } = await axios.get(PAGES_URL);
      setPages(data.results);        
    }
    async function fetchMembers() {
      const { data } = await axios.get(MEMBERS_URL);
      setMembers(data.results);        
    }
    fetchPages();
    fetchMembers();
  }, [PAGES_URL]);

  return (
    <>
      <List>
        <MenuItem 
          key='home'
          component={Link}
          to='/'>
            <Typography variant='h6'>Home</Typography>
          </MenuItem>
        {pages.map((page) => (
          <MenuItem 
            key={page.slug} 
            selected={page === 'Home'}
            component={Link}
            to={`/content/${page.slug}`}>
              <Typography variant='h6'>{page.name}</Typography>
          </MenuItem>
        ))}
      </List>
      <Divider />
      <List>
        <Typography className={classes.menuHeader} variant='h6'>Members</Typography>
        {members?.map((member, index) => (
          <MenuItem 
            key={member.name} 
            component={Link}
            to={`/u/${member.name}`}>
              <Avatar alt={member.name} src={member.avatar_url} />
              <Typography className={classes.memberName} variant='h6'>{member.name}</Typography>
          </MenuItem>
        ))}
      </List>
    </>
  )
}
