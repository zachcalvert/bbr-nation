import React from 'react';

import { Feed } from '../Feed/Feed';

const CONTENT_URL = `${process.env.REACT_APP_DJANGO_URL}api/content/`;

export const AllContent = () => {
  
  return (
    <>
      <Feed url={CONTENT_URL} showControls={true}/>
    </>
  );
}

