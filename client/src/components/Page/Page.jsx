import React from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { Grid, makeStyles, Paper, Typography } from '@material-ui/core';

import { Feed } from '../Feed/Feed';
import { ImageSlider } from '../ImageSlider/ImageSlider';

const useStyles = makeStyles((theme) => ({
  leftAlign: {
    padding: '20px',
    margin: 'auto auto auto 10px'
  },
  pageName: {
    padding: '10px 0 0 20px'
  }
}));

export const Page = () => {
  let { slug } = useParams();
  const classes = useStyles();
  const [name, setName] = React.useState(null);
  const [sliders, setSliders] = React.useState([])
  
  if ( !slug ) {
    slug = 'home'
  } 

  const PAGE_URL = `${process.env.REACT_APP_DJANGO_URL}api/content/${slug}/page_contents`

  React.useEffect(() => {
    async function fetchPage() {
      const { data } = await axios.get(`${process.env.REACT_APP_DJANGO_URL}api/pages/${slug}/`, {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      });
      setName(data.name);
      setSliders(data.image_sliders)
    }
    fetchPage();
  }, [slug]);

  return (
    <>
      <Grid container spacing={1}>
        <Grid item>
          <Typography className={classes.pageName} variant='h6'>{name}</Typography>
        </Grid>
      </Grid>
      {sliders.length > 0 && sliders.map((slider) => (
        <ImageSlider slider={slider} />
      ))
      }
      <Feed url={PAGE_URL} showControls={false}/>
    </>
  )
}