import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios"
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Divider, List, MenuItem, Typography, makeStyles } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import './TableOfContents.css';

const PAGES_URL = `${process.env.REACT_APP_API_URL}/pages/`
const MEMBERS_URL = `${process.env.REACT_APP_API_URL}/members/`

const useStyles = makeStyles((theme) => ({
  memberName: {
    paddingLeft: theme.spacing(1),
  },
  menuHeader: {
    padding: '6px 6px 6px 16px',
  },
  heading: {
    fontSize: theme.typography.pxToRem(6),
    fontWeight: theme.typography.fontWeightRegular,
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
  }, [PAGES_URL, MEMBERS_URL]);

  return (
    <>
      <List>
        <Typography className={classes.menuHeader} variant='h5'>Content</Typography>
        {pages.map((page) => (
          <MenuItem 
            key={page.slug} 
            component={Link}
            to={`/content/${page.slug}`}>
              <Typography variant='h6'>{page.name}</Typography>
          </MenuItem>
        ))}
      </List>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header">
          <Typography variant='h5'>Members</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
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
        </AccordionDetails>
      </Accordion>
    </>
  )
}
