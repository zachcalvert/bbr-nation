import React from 'react';
import { Box, Divider, makeStyles, Paper, Tab, Tabs, Typography } from '@material-ui/core';

import { AllPlayers } from '../Player/AllPlayers';
import { AllTeams } from '../Team/AllTeams';


const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: "auto",
    marginTop: 0,
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
      <Paper className={classes.paper}>
        <Typography variant='h4'>All Time Ranks</Typography>
      </Paper>

      <Divider />

      <Tabs value={value} onChange={handleChange} centered aria-label="member tabs">
        <Tab label="Teams" {...a11yProps(0)} />
        <Tab label="Players" {...a11yProps(1)} />
      </Tabs>

      <TabPanel value={value} index={0}>
        <AllTeams />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <AllPlayers />
      </TabPanel>
    </>
  );
}

