import React from 'react';
import styled from 'styled-components';

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #aaa;
`;

const NewsFilter = ({ value, onChange }) => {
  return (
    <Select value={value} onChange={onChange}>
      <option value="all">공지/소식</option>
      <option value="공지">공지</option>
      <option value="소식">소식</option>
    </Select>
  );
};

export default NewsFilter;