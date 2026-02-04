import React, { Children, useEffect, useState } from 'react';
import socket from '../../socket';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
const Wait = () => {
  return (
    <Wrapper>
      {Children.toArray(
        list.map((v) => (
          <ContentWrapper>
            <div>{v.name}</div>
            <div>{v.total}</div>
          </ContentWrapper>
        )),
      )}
    </Wrapper>
  );
};

const ContentWrapper = styled.div`
  display: flex;
  width: 100%;
  background-color: #2979ff;
  height: 50px;
  align-items: center;
  font-size: 2rem;
  padding: 1rem;
  justify-content: space-between;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
export default Wait;
