import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios";
import { Avatar, Box, Divider, Grid, makeStyles, Paper, Tab, Tabs, Typography } from '@material-ui/core';

import { Feed } from '../Feed/Feed';
import { MemberCareer } from '../Member/MemberCareer';
import './Member.css';

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 20px',
    textAlign: 'left'
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
  const DETAIL_URL = `${process.env.REACT_APP_DJANGO_URL}api/members/${name}/`
  const MEMBER_CONTENT_URL = `${process.env.REACT_APP_DJANGO_URL}api/content/${name}/member/`
  const [member, setMember] = useState({});
  const [nick, setNick] = useState(null);
  const [value, setValue] = React.useState(0);
  const [firstYear, setFirstYear] = React.useState('2015')
  const [lastYear, setLastYear] = React.useState('2020')


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

    setMember({});
    async function fetchUserDetails() {
      const { data } = await axios.get(DETAIL_URL, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setMember(data);
      setFirstYear(data.teams.slice(-1)[0]?.year)
      setLastYear(data.teams[0]?.year)
      setNick(data.nicks[Math.floor(Math.random() * data.nicks.length)])
    }
    fetchUserDetails();
  }, [DETAIL_URL, name]);

  return (
    <>
      <Paper className={classes.paper} variant="outlined">
        <Grid container spacing={1}>
          <Grid item>
            <Avatar className={classes.large} alt={name} src={member.avatar_url} />
          </Grid>
          <Grid item>
            
          </Grid>
          <Grid className={classes.leftAlign} item>
            <Typography variant='h3'>{member.name}</Typography>
            <Typography variant='subtitle1'>aka {nick}</Typography>

            <Divider />
            {lastYear === '2020' ? (
              <Typography variant='h6'>Sweatin' since {firstYear}</Typography>
            ) : (
              <Typography variant='h6'>Career: {firstYear} - {lastYear}</Typography>
            )}
            {member.champ_years && member.champ_years.map((year) => (
              <>
                <Typography variant='h6'><span role='img'>🏆</span> {year}</Typography>
              </>
            ))}
            
            {member.pierced_years && member.pierced_years.map((year) => (
              <>
                <Typography variant='h6'><span role='img'>💍</span> {year}</Typography>
              </>
            ))}
          </Grid>
          <Grid className={classes.leftAlign} item>
            
          </Grid>
        </Grid>
      </Paper>

      <Tabs value={value} onChange={handleChange} centered aria-label="member tabs">
        <Tab label="Career" {...a11yProps(0)} />
        <Tab label="Content" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        {member.name !== 'bbot' && member.teams && <MemberCareer teams={member.teams} />}
        {member.name === 'bbot' && <Typography variant='h6'>Bbot has no fantasy statistics</Typography>}
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Feed url={MEMBER_CONTENT_URL} />
      </TabPanel>
    </>
  )
}