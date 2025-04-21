import React from 'react'
import styled from 'styled-components'
import GameCard from '../components/GameCard'

const GameSection = () => {
  return (
    <Wrap>
        <Title>게임</Title>
        <ContentArea>
            <GameCard name="PROJECT:GENESIS" content="테스트1" link="https://store.onstove.com/ko/games/4278"/>
        </ContentArea>
    </Wrap>
  )
}

const Wrap = styled.section`
    width: 100%;
    height: 100%;
    padding: 0 80px 100px 80px;
    box-sizing: border-box;
    color: #fff;
    font-family: 'Segoe UI', sans-serif;

    @media (max-width: 768px) {
    padding: 50px 20px;
    }
`
const Title = styled.h2`
    font-size: 36px;
    margin-bottom: 50px;
    font-weight: bold;

    @media (max-width: 768px) {
        font-size: 28px;
        margin-bottom: 30px;
    }
`
const ContentArea = styled.div`
    display: flex;
    gap: 40px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 20px;
    }
`
export default GameSection