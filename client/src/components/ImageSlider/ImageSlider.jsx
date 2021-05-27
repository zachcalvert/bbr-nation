import React from "react";
import { Slide } from "react-slideshow-image";
import { Divider, makeStyles, Paper, Typography } from '@material-ui/core';
import "react-slideshow-image/dist/styles.css";

const useStyles = makeStyles((theme) => ({
  sliderContainer: {
    maxWidth: '500px',
    margin: 'auto'
  },
  imageContainer: {
    margin: 'auto',
    maxWidth: '500px'
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'justify',
    color: theme.palette.text.secondary,
    height: "auto",
    margin: theme.spacing(2),
    position: 'relative',
    maxWidth: '800px',
    [theme.breakpoints.down('sm')]: {
        width: '90vw',
    },
    [theme.breakpoints.up('sm')]: {
        width: 'calc(100vw - 350px)',
    },
    name: {
        margin: '0 10px'
    },
    pos: {
        margin: '0 10px',
        fontSize: '16px'
    }
  }
}));

export const ImageSlider = (props) => {
  const { slider } = props;
  const classes = useStyles();

  return (
    <Paper className={classes.paper} variant='outlined'>
      <Typography className={classes.name} color="textPrimary">{slider.name}</Typography>
      <Typography className={classes.pos} color="textSecondary">{slider.description}</Typography>
      <Divider />
      <div className={classes.sliderContainer}>
        <Slide duration={3000} transitionDuration={300} autoplay={false} canSwipe={true}>
            {slider.images.map((image) => (
            <div className={classes.imageContainer}>
              <img width="100%" src={image.upload} />
            </div>
            ))}
        </Slide>
      </div>
    </Paper>
  );
}
