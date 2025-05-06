import React, { useState } from 'react';
import styled from 'styled-components';
import { newsList } from '../data/mockData'; // 기존 뉴스 데이터

const CreateNews = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('공지');
  const [date, setDate] = useState('');
  const [url, setUrl] = useState('');
  const [news, setNews] = useState(newsList);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newNews = {
      id: news.length + 1,
      title,
      type,
      date,
      url,
    };

    setNews([...news, newNews]); // 임시적으로 상태에 저장
    setTitle('');
    setType('공지');
    setDate('');
    setUrl('');
    alert('뉴스가 생성되었습니다!');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Label>
        제목
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Label>
      <Label>
        유형
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="공지">공지</option>
          <option value="소식">소식</option>
        </Select>
      </Label>
      <Label>
        날짜
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </Label>
      <Label>
        링크(URL)
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </Label>
      <Button type="submit">뉴스 생성</Button>
    </Form>
  );
};

export default CreateNews;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #ddd;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #444;
  border-radius: 5px;
  background: #222;
  color: #fff;
  margin-top: 5px;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #444;
  border-radius: 5px;
  background: #222;
  color: #fff;
  margin-top: 5px;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #0056b3;
  }
`;