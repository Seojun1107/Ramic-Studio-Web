import React from 'react';
import ReactPaginate from 'react-paginate';
import styled from 'styled-components';

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;

  ul {
    display: flex;
    list-style: none;
    gap: 8px;
    padding: 0;

    li {
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;

      &.selected {
        background-color: #000;
        color: #fff;
      }

      &:hover {
        background-color: #f0f0f0;
      }
    }
  }
`;

const Pagination = ({ pageCount, onPageChange }) => {
  return (
    <PaginationWrapper>
      <ReactPaginate
        previousLabel={'←'}
        nextLabel={'→'}
        breakLabel={'...'}
        pageCount={pageCount}
        marginPagesDisplayed={1}
        pageRangeDisplayed={5}
        onPageChange={onPageChange}
        containerClassName={'pagination'}
        activeClassName={'selected'}
        renderOnZeroPageCount={null}
      />
    </PaginationWrapper>
  );
};

export default Pagination;