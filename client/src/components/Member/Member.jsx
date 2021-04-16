import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios";
import { Avatar, Box, Divider, makeStyles, List, ListItem, ListItemText, Tab, Tabs, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import { Feed } from '../Feed/Feed';
import { MemberCareer } from '../Member/MemberCareer';
import './Member.css';

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '10px',
    margin: 'auto auto auto 10px',
    
  },
  large: {
    width: theme.spacing(16),
    height: theme.spacing(16),
  },
  card: {
    padding: '0',
    marginBottom: theme.spacing(1)
  },
  title: {
    fontSize: 14,
  },
  actions: {
    paddingLeft: '20px'
  },
  cardContent: {
    display: 'flex',
    margin: 'auto'
  },
  playerBio: {
    margin: 'auto auto auto 20px',
    display: 'block',
  }
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
  const [member, setMember] = useState({});
  const [nick, setNick] = useState(null);
  const [value, setValue] = React.useState(0);
  const [firstYear, setFirstYear] = React.useState('2015')
  const [lastYear, setLastYear] = React.useState('2020');
  const [contentUrl, setContentUrl] = React.useState(null);

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
      setContentUrl(`${process.env.REACT_APP_DJANGO_URL}api/content/?creator_id=${data.id}`)
    }
    fetchUserDetails();
  }, [DETAIL_URL, name]);

  return (
    <>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          {member.avatar_url && <Avatar className={classes.large} src={member.avatar_url} />}

          <div className={classes.playerBio}>
            <Typography variant="h5" component="h2">
              {member.name}
            </Typography>
            <Divider />
            <Typography className={classes.pos} color="textSecondary" gutterBottom>
              aka {nick}
            </Typography>
            
            {lastYear === '2020' ? (
              <Typography color="textSecondary" className={classes.title} >since {firstYear}</Typography>
            ) : (
              <Typography color="textSecondary" className={classes.title} >career: {firstYear} - {lastYear}</Typography>
            )}
            <List>
            {member.champ_years && member.champ_years.map((year) => (
              <Typography color="textSecondary" className={classes.title} >{`🏆  ${year}`}</Typography>
            ))}
            {member.pierced_years && member.pierced_years.map((year) => (
              <Typography color="textSecondary" className={classes.title} >{`💍  ${year}`}</Typography>
            ))}
          </List>
          </div>
        </CardContent>
      </Card>

      <Tabs value={value} onChange={handleChange} centered aria-label="member tabs">
        <Tab label="Career" {...a11yProps(0)} />
        <Tab label="Content" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        {member.name !== 'bbot' && member.teams && <MemberCareer teams={member.teams} />}
        {member.name === 'bbot' && <Typography variant='h6'>Bbot has no fantasy statistics</Typography>}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {contentUrl && <Feed url={contentUrl} showControls={true} memberId={member.id} />}
      </TabPanel>
    </>
  )
}