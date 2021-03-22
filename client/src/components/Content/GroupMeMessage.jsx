import React from 'react';
import { Divider, Grid, Typography, makeStyles } from '@material-ui/core';
import { FormattedTime } from '../Common'

const useStyles = makeStyles((theme) => ({
  date: {
    textAlign: 'right'
  }
}));

export const GroupMeMessage = (props) => {
    const { message } = props;
    const classes = useStyles();
    const [loadingAttachment, setLoadingAttachment] = React.useState(false);

    return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant='subtitle2'>{message.creator}</Typography>
          {message.text && <Typography variant='h6'>{message.text}</Typography>}
        </Grid>
      </Grid>
      <Typography className={classes.date} variant='subtitle2'>{FormattedTime(message.created_date)}</Typography>
      <Divider />
    </>
    )
}