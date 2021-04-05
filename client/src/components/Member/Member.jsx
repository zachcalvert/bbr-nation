import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { Avatar, Box, Divider, Grid, makeStyles, Paper, Tab, Tabs, Typography } from '@material-ui/core';

import { Feed } from '../Feed/Feed';
import { MemberCareer } from '../Member/MemberCareer'

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 10px'
  },
  large: {
    width: theme.spacing(20),
    height: theme.spacing(20),
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
    position: 'relative'
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export const Member = () => {
  const classes = useStyles();

  const { name } = useParams();
  const DETAIL_URL = `${process.env.REACT_APP_API_URL}/members/${name}/`
  const MEMBER_CONTENT_URL = `${process.env.REACT_APP_API_URL}/content/${name}/member`
  
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [nicks, setNicks] = useState([]);
  const nickname = nicks[Math.floor(Math.random() * nicks.length)];
  const [value, setValue] = React.useState(0);
  const [teams, setTeams] = React.useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    async function fetchUserDetails() {
      const { data } = await axios.get(DETAIL_URL);
      setAvatarUrl(data.avatar_url);
      setNicks(data.nicks);
      setTeams(data.teams);
    }
    fetchUserDetails();
  }, [DETAIL_URL, name]);

  return (
    <>
      <Paper className={classes.paper}>
        <Grid container spacing={1}>
          <Grid item>
            <Avatar className={classes.large} alt={name} src={avatarUrl} />
          </Grid>
          <Grid className={classes.leftAlign} item>
            <Typography variant='h3'>{name}</Typography>
            <Typography variant='h6'>aka {nickname}</Typography>
          </Grid>
        </Grid>
      </Paper>
      <Divider />
      <Tabs value={value} onChange={handleChange} centered aria-label="member tabs">
        <Tab label="Career" {...a11yProps(0)} />
        <Tab label="Content" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <MemberCareer teams={teams} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Feed url={MEMBER_CONTENT_URL} />
      </TabPanel>

    </>
  )
}