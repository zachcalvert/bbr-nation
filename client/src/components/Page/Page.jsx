import React from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { Grid, makeStyles, Typography } from '@material-ui/core';

import { Feed } from '../Feed/Feed';


const API_URL = `${process.env.REACT_APP_API_URL}`
let PAGE_URL;

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 10px'
  }
}));

export const Page = () => {
  let { slug } = useParams();
  const classes = useStyles();
  const [name, setName] = React.useState(null);
  
  if ( !slug ) {
    slug = 'home'
  } 

  PAGE_URL = `${API_URL}/content/${slug}/page`

  React.useEffect(() => {
    async function fetchPage() {
      const { data } = await axios.get(`${API_URL}/pages/${slug}`);
      setName(data.name);
    }
    fetchPage();
  }, [slug]);

  return (
    <>
      <Grid container spacing={1}>
        <Grid item>
          <Typography variant='h4'>{name}</Typography>
        </Grid>
        <Grid className={classes.leftAlign} item>
        </Grid>
      </Grid>

      <Feed url={PAGE_URL}/>
    </>
  )
}