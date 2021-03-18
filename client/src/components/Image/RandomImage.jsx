import React, { useEffect, useState } from 'react'
import axios from "axios"
import { API_URL } from "../../constants"
import { Typography } from '@material-ui/core';
import { FormattedTime } from '../Common'

import './RandomImage.css'

export const RandomImage = () => {
  const [image, setImage] = useState([]);
  const [createdDate, setCreatedDate] = useState(null);
  const RANDOM_IMAGE_URL = `${API_URL}images/random/`

  useEffect(() => {
    async function fetchRandomImage() {
      const { data } = await axios.get(RANDOM_IMAGE_URL);
      setImage(data);
      setCreatedDate(FormattedTime(data.create_date));        
    }
    fetchRandomImage();
  }, []);

  return (
    <div className='bbr-image'>
      <img src={image.upload} />
      {image.text && <Typography variant='h6'>"{image.text}"</Typography>}
      <Typography variant='subtitle1'>{image.creator} - {createdDate}</Typography>
    </div>
  )
}