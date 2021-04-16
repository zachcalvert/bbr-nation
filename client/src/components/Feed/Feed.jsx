import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from "axios"
import { Button, Grid, makeStyles, Typography } from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import WhatshotIcon from '@material-ui/icons/Whatshot';
import HelpRoundedIcon from '@material-ui/icons/HelpRounded';
import UpdateRoundedIcon from '@material-ui/icons/UpdateRounded';
import RestoreRoundedIcon from '@material-ui/icons/RestoreRounded';
import LocalMoviesRoundedIcon from '@material-ui/icons/LocalMoviesRounded';
import PhotoLibraryRoundedIcon from '@material-ui/icons/PhotoLibraryRounded';

import { Content } from '../Content/Content';
import { ContentModal } from '../Content/ContentModal';
import './Feed.css'

const CONTENT_URL = `${process.env.REACT_APP_DJANGO_URL}api/content`

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow:'scroll',
  },
  modalPaper: {
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    minWidth: '350px',
    borderRadius: '4px'
  },
  content: {
    padding: theme.spacing(2),
    height: "auto",
    position: 'relative',
    maxWidth: `100vw`
  },
  date: {
    textAlign: 'right'
  },
  viewConversation: {
    margin: '0 auto',
    display: 'block'
  },
  seeMore: {
    position: 'absolute',
    bottom: '15px',
    right: '5px'
  },
  filtering: {
    padding: '10px 20px 0 20px',
    float: 'right'
  },
  ordering: {
    padding: '10px 20px 0 20px',
  }
}));


export const Feed = (props) => {
  const BASE_URL = props.url;
  const { memberId } = props;
  const { showControls } = props;
  const [url, setUrl] = useState(props.url);
  const history = useHistory();
  const classes = useStyles();

  const [content, setContent] = useState([]);
  const [filter, setFilter] = useState(null);
  const [order, setOrder] = useState(null);

  const [activeContent, setActiveContent] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  const [nextUrl, setNexUrl] = useState(null);
  const [isBottom, setIsBottom] = useState(false);
  const [keepScrolling, setKeepScrolling] = useState(true);

  async function fetchContent(url, append=true) {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    
    if (!append) {
      setContent([]);
      setContent(data.results)
    } else {
      setContent([...content, ...data.results]);
    }
    setIsBottom(false);
    
    if (!data.next) {
      setKeepScrolling(false);
    }
    setNexUrl(data.next);
  }

  async function fetchContentDetails(name) {
    const { data } = await axios.get(`${CONTENT_URL}/${name}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`
      }
    });
    setActiveContent(data);
  }

  // first load
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
    fetchContent(url, false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const contentName = urlParams.get('content');
    if (contentName) {
      fetchContentDetails(contentName)
      setOpen(true);
    }
  }, [url]);

  // scroll stuff
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleScroll() {
    const scrollTop = (document.documentElement
      && document.documentElement.scrollTop)
      || document.body.scrollTop;
    const scrollHeight = (document.documentElement
      && document.documentElement.scrollHeight)
      || document.body.scrollHeight;
    if (scrollTop + window.innerHeight + 50 >= scrollHeight){
      setIsBottom(true);
    }
  }

  useEffect(() => {
    if (isBottom && keepScrolling && nextUrl) {
      fetchContent(nextUrl);
    }
  }, [isBottom, keepScrolling, nextUrl]);

  const handleClick = (content, e) => {
    setActiveContent(content);
    setOpen(true);
    history.push({
      search: `?content=${content.name}`
    })
    document.activeElement.blur();
  };

  const handleClose = () => {
    setOpen(false);
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.has('content')) {
      queryParams.delete('content')
      history.replace({
        search: '',
      })
    }
  };

  const handleFilterChange = (event, newFilter) => {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    if (newFilter) {
      setFilter(newFilter);
      params.set('kind', newFilter)
      order && params.set('ordering', order)
    } else {
      setFilter(null);
      params.delete('kind')
      order && params.set('ordering', order)
    }
    BASE_URL.includes('creator_id') ? (
      setUrl(`${BASE_URL}&${params}`)
    ) : (
      setUrl(`${BASE_URL}?${params}`)
    )
  };

  const handleOrderChange = (event, newOrder) => {
    setOrder(newOrder);
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    params.set('ordering', newOrder)
    filter && params.set('kind', filter)
    BASE_URL.includes('creator_id') ? (
      setUrl(`${BASE_URL}&${params}`)
    ) : (
      setUrl(`${BASE_URL}?${params}`)
    )
  };

  return (
    <>
      {showControls &&
        <Grid container xs={12}>
          <Grid item xs={6}>

            <ToggleButtonGroup
              value={order}
              exclusive
              className={classes.ordering}
              onChange={handleOrderChange}
              aria-label="content-sorter">

              <ToggleButton value="?" aria-label="random order">
                <Typography variant='h6'><HelpRoundedIcon /></Typography>
              </ToggleButton>

              <ToggleButton value="-likes" aria-label="most popular">
                <Typography variant='h6'><WhatshotIcon /></Typography>
              </ToggleButton>

              <ToggleButton value="-create_date" aria-label="most recent">
                <Typography variant='h6'><UpdateRoundedIcon /></Typography>
              </ToggleButton>

              <ToggleButton value="create_date" aria-label="earliest">
                <Typography variant='h6'><RestoreRoundedIcon /></Typography>
              </ToggleButton>

            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={6}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              className={classes.filtering}
              onChange={handleFilterChange}
              aria-label="content-filter">

              <ToggleButton value="VIDEO" aria-label="videos">
                <Typography variant='h6'><LocalMoviesRoundedIcon /></Typography>
              </ToggleButton>

              <ToggleButton value="IMAGE" aria-label="images">
                <Typography variant='h6'><PhotoLibraryRoundedIcon /></Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      }

      {content.map((c) => (
        <div className={classes.content} key={c.name}>
          <Button size="small" className={classes.seeMore} onClick={(e) => handleClick(c, e)}>
            <MoreHorizIcon />
          </Button>
          <Content key={c.id} content={c} />
        </div>
      ))}
      
      {open && activeContent && <ContentModal open={open} handleClose={handleClose} activeContent={activeContent} />}
    </>
  )
}