import React, { useState } from 'react';
import styled from 'styled-components';
import NewsCard from '../components/NewsCard';
import NewsFilter from '../components/NewsFilter';
import Pagination from '../components/Pagination';
import {newsList} from '../data/mockData'; // 가상 데이터

const Wrapper = styled.div`
  max-width: 800px;
  height: 1000px;
  margin: 100px auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
`;

const News = () => {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PER_PAGE = 4;

  const filtered = newsList.filter((item) =>
    filter === 'all' ? true : item.type === filter
  );

  const offset = page * PER_PAGE;
  const currentPageData = filtered.slice(offset, offset + PER_PAGE);
  const pageCount = Math.ceil(filtered.length / PER_PAGE);

  const handlePageClick = ({ selected }) => setPage(selected);
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(0); // 페이지 리셋
  };

  return (
    <Wrapper className='noneDrag'>
      <Header>
        <Title>공지/소식</Title>
        <NewsFilter value={filter} onChange={handleFilterChange} />
      </Header>
      {currentPageData.map((item) => (
        <NewsCard key={item.id} {...item} />
      ))}
      <Pagination pageCount={pageCount} onPageChange={handlePageClick} />
    </Wrapper>
  );
};

export default News;