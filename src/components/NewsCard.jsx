import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.12);
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
`;

const Badge = styled.span`
  display: inline-block;
  background: ${({ type }) => (type === '공지' ? '#ff585d' : '#3a86ff')};
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  margin-bottom: 8px;
  width: fit-content;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #222;
`;

const Date = styled.div`
  font-size: 14px;
  color: #999;
  align-self: flex-end;
`;

const NewsCard = ({ type, title, date }) => {
  return (
    <Card>
      <Info>
        <Badge type={type}>{type}</Badge>
        <Title>{title}</Title>
      </Info>
      <Date>{date}</Date>
    </Card>
  );
};

export default NewsCard;