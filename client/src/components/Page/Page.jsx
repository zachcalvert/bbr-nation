import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios"
import { API_URL } from "../../constants"

import { Content } from '../Content/Content';
import './Page.css'

const FEED_URL = `${API_URL}content/`

export const Page = () => {
  const { slug } = useParams();
  const [content, setContent] = useState([]);
  const [isBottom, setIsBottom] = useState(false);
  const [nextUrl, setNexUrl] = useState(null);
  const [keepScrolling, setKeepScrolling] = useState(true);

  let contentUrl;
  if (slug) {
    contentUrl = `${FEED_URL}${slug}`;
  } else {
    contentUrl = `${FEED_URL}random`;
  }

  useEffect(() => {
    setContent([]);

    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    async function fetchContent() {
      const { data } = await axios.get(contentUrl);
      setContent(data.results);
      if (data.next) {
        setNexUrl(data.next);
      } else {
        setKeepScrolling(false);
      }
    }
    fetchContent();
  }, [slug]);

  // add scroll listener to detect if we've reach the bottom of the page
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
    if (isBottom && keepScrolling) {
      fetchContent(nextUrl);
    }
  }, [isBottom]);

  async function fetchContent(url) {
    const { data } = await axios.get(url);
    setContent([...content, ...data.results]);
    setIsBottom(false);
    if (!data.next) {
      setKeepScrolling(false);
    }
    setNexUrl(data.next);
  }

  return (
    <>
      {content.map((c, index) => (
        <Content key={c.id} content={c} />
      ))}
    </>
  )
}