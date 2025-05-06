// 메인 페이지중 소식 섹션을 담당하는 컴포넌트입니다.
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import { newsList } from '../data/mockData'; // 가상 데이터 가져오기

const NewsSection = () => {
    const navigate = useNavigate();

    const handleNewsClick = (url) => {
        if (url) {
            navigate(url); // 동적으로 라우팅
        }
    };

    return (
        <PostWrap>
            <Title>📢 소식</Title>
            <ContentArea>
                <MainCard onClick={() => handleNewsClick(newsList[0].url)}>
                    <MainImage src="https://via.placeholder.com/640x360" alt="main" />
                    <MainContent>
                        <Tag>소식</Tag>
                        <MainTitle>
                            우주하마님께서 이번에 저희 플레져가든에서 출시된 게임,<br /> Snowscape를 플레이해주셨습니다!
                        </MainTitle>
                        <Date>2025.04.13</Date>
                    </MainContent>
                </MainCard>

                <SideList>
                    {newsList.map((news) => (
                        <SideCard key={news.id} onClick={() => handleNewsClick(news.url)}>
                            <SideText>
                                <small>{news.type}</small>
                                <span>{news.title}</span>
                            </SideText>
                            <SideThumb src="https://via.placeholder.com/100x60" />
                        </SideCard>
                    ))}
                </SideList>
            </ContentArea>

            <SeeAllBtn onClick={() => navigate("/news")}>모두 보기</SeeAllBtn>
        </PostWrap>
    );
};

const PostWrap = styled.section`
  width: 100%;
  //background: radial-gradient(circle at top left, #0f0f0f, #070707);
  padding: 100px 80px;
  box-sizing: border-box;
  color: #fff;
  font-family: 'Segoe UI', sans-serif;

  @media (max-width: 768px) {
    padding: 50px 20px;
  }
`;

const Title = styled.h2`
  font-size: 36px;
  margin-bottom: 50px;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 30px;
  }
`;

const ContentArea = styled.div`
  display: flex;
  gap: 40px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const MainCard = styled.div`
  flex: 1.6;
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer; /* 클릭 가능하도록 커서 변경 */

  &:hover {
    transform: scale(1.015);
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
  }
`;

const MainImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const MainContent = styled.div`
  padding: 24px;
`;

const Tag = styled.div`
  font-size: 12px;
  color: #aaa;
  margin-bottom: 8px;
`;

const MainTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Date = styled.div`
  font-size: 13px;
  margin-top: 12px;
  color: #888;
`;

const SideList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
  }
`;

const SideCard = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 14px 18px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.25s ease;
  cursor: pointer; /* 클릭 가능하도록 커서 변경 */

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: scale(1.01);
  }
`;

const SideText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 14px;

  span {
    font-weight: 500;
    color: #ddd;
  }

  small {
    font-size: 11px;
    color: #888;
    margin-bottom: 4px;
  }
`;

const SideThumb = styled.img`
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin-left: 16px;
`;

const SeeAllBtn = styled.button`
  margin-top: 40px;
  background: #222;
  color: #fff;
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid #444;
  font-weight: 600;
  cursor: pointer;
  float: right;
  transition: 0.2s ease;

  &:hover {
    background: #333;
  }

  @media (max-width: 768px) {
    float: none;
    width: 100%;
    text-align: center;
  }
`;

export default NewsSection;