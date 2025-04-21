import React from 'react'
import styled from 'styled-components'

const GameCard = () => {
  return (
    <Wrap>
      <img src="https://cdn.discordapp.com/attachments/1136324826634900510/1153677176170089522/ramic.png" alt="Game" style={{ width: '100%', height: 'auto', borderRadius: '20px' }} />
      <h3 style={{ marginTop: '10px' }}>PROJECT:GENESIS</h3>
      <p>테스트1</p>
      <a href="https://store.onstove.com/ko/games/4278" style={{ color: '#fff', textDecoration: 'none', marginTop: '10px' }}>게임 보러가기</a>
    </Wrap>
  )
}

const Wrap = styled.div`
    width: 350px;
    height: 100%;
    background-color: #1c1c1c;
    border-radius: 20px;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
`
export default GameCard