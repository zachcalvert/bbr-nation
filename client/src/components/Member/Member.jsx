import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { Avatar, Box, Divider, Grid, makeStyles, Paper, Tab, Tabs, Typography } from '@material-ui/core';

import { Feed } from '../Feed/Feed';
import { MemberCareer } from '../Member/MemberCareer'

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
  const DETAIL_URL = `${process.env.REACT_APP_API_URL}/members/${name}/`
  const MEMBER_CONTENT_URL = `${process.env.REACT_APP_API_URL}/content/${name}/member`
  const [member, setMember] = useState({});
  const [value, setValue] = React.useState(0);

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
      setMember(data);
    }
    fetchUserDetails();
  }, [DETAIL_URL, name]);

  return (
    <>
      <Paper className={classes.paper}>
        <Grid container spacing={1}>
          <Grid item>
            <Avatar className={classes.large} alt={name} src={member.avatar_url} />
          </Grid>
          <Grid className={classes.leftAlign} item>
            <Typography variant='h3'>{member.name}</Typography>
            {member.champYears ? member.champYears.map((year) => (
              <>
                <Typography variant='h6'>🏆  {year} champion</Typography>
              </>
            )) : (
              <Typography variant='h6'>Best finish: {member.best_finish}</Typography>
            )}
            {member.piercedYears ? member.piercedYears.map((year) => (
              <>
                <Typography variant='h6'>💍 Pierced in {year}</Typography>
              </>
            )) : (
              <Typography variant='h6'>Worst finish: {member.worst_finish}</Typography>
            )}
          </Grid>
          <Grid className={classes.leftAlign} item>
            
          </Grid>
        </Grid>
      </Paper>
      <Divider />
      <Tabs value={value} onChange={handleChange} centered aria-label="member tabs">
        <Tab label="Career" {...a11yProps(0)} />
        <Tab label="Content" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        {member.teams && <MemberCareer teams={member.teams} />}
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Feed url={MEMBER_CONTENT_URL} />
      </TabPanel>
    </>
  )
}