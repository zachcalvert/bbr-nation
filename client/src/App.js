import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Route } from 'react-router-dom';
import { createMuiTheme, CssBaseline, Grid, Hidden, Link, ThemeProvider, makeStyles } from '@material-ui/core';
import { AppBar, Drawer, Fab, IconButton, TextField, Toolbar, Typography } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import HomeRoundedIcon from '@material-ui/icons/HomeRounded';
import NightsStayRoundedIcon from '@material-ui/icons/NightsStayRounded';
import WbSunnyRoundedIcon from '@material-ui/icons/WbSunnyRounded';

import { AllContent } from "./components/Content/AllContent";
import { AntSwitch } from "./components/AntSwitch/AntSwitch";
import { Chat } from "./components/Chat/Chat";
import { DraftResults } from "./components/Draft/DraftResults";
import { Page } from "./components/Page/Page";
import { TableOfContents } from './components/TableOfContents/TableOfContents';
import { Member } from './components/Member/Member';
import { Player } from './components/Player/Player';
import { AllSeasons } from './components/Season/AllSeasons';
import { Season } from './components/Season/Season';
import { Team } from './components/Team/Team';
import { Thought } from './components/Thought/Thought';

const drawerWidth = 250;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    background: '#4E78A0',
    zIndex: theme.zIndex.drawer + 1,
    [theme.breakpoints.up('sm')]: {
      width: '100%',
      marginLeft: drawerWidth,
    },
  },
  darkModeToggle: {
    marginLeft: 'auto'
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  loginForm: {
    margin: '200px auto',
    display: 'grid'
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  // necessary for content to be below app bar
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(2),
    },
  },
}));

export const App = (props) => {
  const classes = useStyles();
  const [prefersDarkMode, setPrefersDarkMode] = React.useState(localStorage.getItem('dark-mode') === 'true');
  const theme = createMuiTheme({
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
    },
  });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      <TableOfContents />
    </div>
  );

  const handleDarkModeChange = () => {
    setPrefersDarkMode(!prefersDarkMode);
    localStorage.setItem('dark-mode', !prefersDarkMode)
  }

  const handleLogin = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_DJANGO_URL}token-auth/`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "username": username,
        "password": password
      })
      })
      .then(res => res.json())
      .then(json => {
          localStorage.setItem('token', json.token);
          setUsername(json.user.username);
          setLoggedIn(true);
      })
      .catch((error) => {
        setLoginError(true);
        setTimeout(() => setLoginError(false), 2000);
        setLoggedIn(false);
        localStorage.removeItem('token');
      });
  };

  React.useEffect(() => {
    if (localStorage.getItem('token')) {
      fetch(`${process.env.REACT_APP_DJANGO_URL}current_user/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      })
      .then(function(response) {
        if (response.status === 401) {
          setLoggedIn(false);
        } else if (response.status === 200) {
          console.log(response)
          setLoggedIn(true);
          setUsername(response.username);
        }
      })
      .catch((error) => {
        setLoggedIn(false);
      });
    }
  }, [])

  return (
    <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <Link color="inherit" href="/">
            <HomeRoundedIcon fontSize='large' />
          </Link>

          <Typography className={classes.darkModeToggle} component="div">
            <Grid component="label" container alignItems="center" spacing={1}>
              <Grid item><NightsStayRoundedIcon /></Grid>
              <Grid item>
                <AntSwitch checked={prefersDarkMode} onChange={handleDarkModeChange} name="darkModeSwitch" />
              </Grid>
              <Grid item><WbSunnyRoundedIcon /></Grid>
            </Grid>
          </Typography>
        </Toolbar>
      </AppBar>
      {loggedIn && 
        <nav className={classes.drawer}>
          <Hidden smUp implementation="css">
            <Drawer
              variant="temporary"
              anchor='left'
              open={mobileOpen}
              onClose={handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
            >
              {drawer}
            </Drawer>
          </Hidden>
          <Hidden xsDown implementation="css">
            <Drawer
              classes={{
                paper: classes.drawerPaper,
              }}
              variant="permanent"
              open
            >
              {drawer}
            </Drawer>
          </Hidden>
        </nav>
      }
      {loggedIn ? 
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <Grid className={classes.container} container spacing={1}>
            <Grid item xs={12}>
              <Route path="/draft/" component={DraftResults} />
              <Route path="/bot/thought" component={Thought} />
              <Route path="/bot/chat" component={Chat} />
              <Route path="/u/:name" component={Member} />
              <Route path="/content" exact component={AllContent} />
              <Route path="/content/:slug" component={Page} />
              <Route path="/season/:year/team/:id" component={Team} />
              <Route path="/season/:year" exact component={Season} />
              <Route path="/player/:id" exact component={Player} />
              <Route path="/all-time-ranks/" exact component={AllSeasons} />
              <Route path="/" exact component={AllContent} />
            </Grid>
          </Grid>
        </main>
      : 
        <form className={classes.loginForm} onSubmit={event => handleLogin(event)}>
          <TextField
              id="username"
              helperText="username"
              autoFocus={true}
              onChange={e => setUsername(e.target.value.trim())}
              value={username}
              fullWidth  />
          <TextField
              id="password"
              onChange={e => setPassword(e.target.value.trim())}
              helperText="password"
              type="password"
              onChange={e => setPassword(e.target.value.trim())}
              value={password}
              fullWidth  />
          <Fab variant="extended"
              style={{ padding: '20px', margin: '20px' }}
              color="primary"
              type="submit">
              Login
          </Fab>
          {loginError && <img width="150px" src="/dikembe.gif" />}
        </form>}
    </div>
    </ThemeProvider>
    </BrowserRouter>
  );
}

App.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

export default App;