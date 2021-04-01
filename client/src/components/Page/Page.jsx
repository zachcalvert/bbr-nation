import React from 'react';
import { useParams } from 'react-router-dom';
import { Feed } from '../Feed/Feed';

const API_URL = `${process.env.REACT_APP_API_URL}`
let PAGE_URL;
export const Page = () => {
  const { slug } = useParams();
  
  if ( slug ) {
    PAGE_URL = `${process.env.API_URL}/content/${slug}`
  } else {
    PAGE_URL = `${process.env.API_URL}/content/`
  }

  return (
    <Feed url={PAGE_URL}/>
  )
}