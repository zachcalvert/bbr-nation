import React from 'react';
import { Box, Divider, makeStyles, Paper, Tab, Tabs, Typography } from '@material-ui/core';

import { AllMembers } from '../Member/AllMembers';
import { AllPlayers } from '../Player/AllPlayers';
import { AllTeams } from '../Team/AllTeams';


const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
    marginBottom: theme.spacing(1),
    position: 'relative'
  }
}));


function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

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

export const AllSeasons = () => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  
  return (
    <>
      <Paper className={classes.paper} variant='outlined'>
        <Typography variant='h4'>All Time Ranks</Typography>
      </Paper>

      <Tabs value={value} onChange={handleChange} centered aria-label="member tabs">
        <Tab label="Members" {...a11yProps(0)} />
        <Tab label="Teams" {...a11yProps(1)} />
        <Tab label="Players" {...a11yProps(2)} />
      </Tabs>

      <TabPanel value={value} index={0}>
        <AllMembers />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <AllTeams />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <AllPlayers />
      </TabPanel>
    </>
  );
}

