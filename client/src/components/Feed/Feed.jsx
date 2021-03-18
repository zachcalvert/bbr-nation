import React, { useEffect, useState } from 'react'
import axios from "axios"
import { CONTENT_URL } from "../../constants"

export const Feed = () => {
  const [content, setContent] = useState([]);

  useEffect(() => {
    async function fetchContent() {
      const { data } = await axios.get(CONTENT_URL);
      setContent(data.results);        
    }
    fetchContent();
  }, []);

  const renderContent = (c) => {
    return (
      <>
        {c.content_type === 'VIDEO' && <video controls width="100%"><source src={c.upload} type="video/mp4"/></video>}
        {c.content_type === 'IMAGE' && <img style={{ width: "100%", height: "auto" }} src={c.upload} />}
      </>
    )
  };

  return (
    <div class='bbr-feed'>
      {content.map((c) => (
        renderContent(c)
      ))}
    </div>
  )
}