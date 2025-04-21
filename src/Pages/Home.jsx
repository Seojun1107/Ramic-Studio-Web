import React from 'react'
import styled from 'styled-components'
import MainVideo from "../images/ramic.mov"
import NewsSection from '../containers/NewsSection'
import GameSection from '../containers/GameSection'

const Home = () => {
  return (
    <Wrap>
      <Video autoPlay loop muted>
        <source src={MainVideo} type="video/mp4" />
      </Video>

      <PostWrap height={"100%"}>  
        <NewsSection/>
        <GameSection/>
      </PostWrap>


    </Wrap>
  )
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  display: block; // 중요
  margin: 0;
  padding: 0;
`;

const PostWrap = styled.div`
  width: 100%;
  height: ${props => props.height};
  background: radial-gradient(circle at top left, #0f0f0f, #070707);
  color: white;
  margin: 0;
  padding: 0;
`;



export default Home